
import { ref, computed, watch } from 'vue';
import { getMonthParams, RATES, FIXED_MEDICAL_ADDITION, SPECIAL_DEDUCTIONS, calculateIIT, calculateBonusTax } from '../data/constants';

export function useSalaryCalculation() {
    const currentYear = ref(new Date().getFullYear());
    const selectedYear = ref(2026); // Default to current/next (2026 as requested)

    // Inputs
    const salaryInputs = ref({
        p1: 0,
        p2: 0
    });

    const baseInputs = ref({
        p1: 0,
        p2: 0
    });

    // Housing Fund Configuration
    const housingFundEnabled = ref(true); // Default enabled
    const housingInputs = ref({
        p1: 0, // Base
        p2: 0
    });

    const selectedDeductions = ref([]); // Array of deduction IDs
    const bonus = ref(0);
    const bonusMethod = ref('standalone'); // 'standalone' or 'merged'

    // Helper to detect if policy (SS params) is same for both halves of the year
    const isPolicySame = computed(() => {
        const p1 = getMonthParams(selectedYear.value, 1);
        const p2 = getMonthParams(selectedYear.value, 7);
        return p1.minBase === p2.minBase && p1.maxBase === p2.maxBase && p1.avgSalary === p2.avgSalary &&
            p1.housingMin === p2.housingMin && p1.housingMax === p2.housingMax;
    });

    // Watch year change to update defaults
    const updateDefaults = () => {
        const p1 = getMonthParams(selectedYear.value, 1);
        const p2 = getMonthParams(selectedYear.value, 7);

        // Default to Avg Salary 
        salaryInputs.value.p1 = p1.avgSalary;
        salaryInputs.value.p2 = p2.avgSalary;

        // Default SS Base to Avg Salary
        baseInputs.value.p1 = p1.avgSalary;
        baseInputs.value.p2 = p2.avgSalary;

        // Default Housing Base to Min
        housingInputs.value.p1 = p1.housingMin;
        housingInputs.value.p2 = p2.housingMin;
    };

    // Initial run
    updateDefaults();

    watch(selectedYear, () => {
        updateDefaults();
    });

    const monthlyData = computed(() => {
        const year = selectedYear.value;
        const months = [];
        let accumulatedIncome = 0;
        let accumulatedDeductions = 0;
        let accumulatedSpecialDeductions = 0;
        let accumulatedTaxPaid = 0;

        // Get deduction amount per month
        let monthlySpecialDeductionTotal = 0;
        SPECIAL_DEDUCTIONS.forEach(d => {
            if (selectedDeductions.value.includes(d.id)) {
                if (d.isYearly) {
                    monthlySpecialDeductionTotal += d.amount / 12;
                } else {
                    monthlySpecialDeductionTotal += d.amount;
                }
            }
        });

        for (let m = 1; m <= 12; m++) {
            const isSecondHalf = m >= 7;
            const periodKey = isSecondHalf ? 'p2' : 'p1';

            const salary = Number(salaryInputs.value[periodKey]) || 0;

            const params = getMonthParams(year, m);

            // Determine SS Base
            let userBase = Number(baseInputs.value[periodKey]);

            // Enforce Min/Max strictly
            let actualBase = userBase;
            if (actualBase < params.minBase) {
                actualBase = params.minBase;
            }
            if (actualBase > params.maxBase) {
                actualBase = params.maxBase;
            }

            // Calculate Social Security
            const pension = actualBase * RATES.pension.self;
            const medical = actualBase * RATES.medical.self + FIXED_MEDICAL_ADDITION;
            const unemployment = actualBase * RATES.unemployment.self;

            // Calculate Housing Fund
            let housing = 0;
            let coHousing = 0;
            let actualHousingBase = 0;

            if (housingFundEnabled.value) {
                let userHousingBase = Number(housingInputs.value[periodKey]);
                actualHousingBase = userHousingBase;

                // Clamp Housing Base
                if (actualHousingBase < params.housingMin) {
                    actualHousingBase = params.housingMin;
                }
                if (actualHousingBase > params.housingMax) {
                    actualHousingBase = params.housingMax;
                }
                housing = actualHousingBase * RATES.housing.self;
                coHousing = actualHousingBase * RATES.housing.company;
            }

            const totalSocialPersonal = pension + medical + unemployment + housing;

            // Calculate Company Costs
            const coPension = actualBase * RATES.pension.company;
            const coMedical = actualBase * RATES.medical.company; // Includes Maternity often
            const coUnemployment = actualBase * RATES.unemployment.company;
            const coInjury = actualBase * RATES.injury.company;
            const coMaternity = actualBase * RATES.maternity.company;
            // Housing calculated above

            const totalSocialCompany = coPension + coMedical + coUnemployment + coInjury + coMaternity + coHousing;

            // Tax Calculation (Cumulative)
            const monthSalary = salary;
            accumulatedIncome += monthSalary;
            const standardDeduction = 5000 * m;
            accumulatedDeductions += totalSocialPersonal;
            accumulatedSpecialDeductions += monthlySpecialDeductionTotal;

            const taxableIncome = Math.max(0, accumulatedIncome - standardDeduction - accumulatedDeductions - accumulatedSpecialDeductions);

            // In Merged mode, bonus is NOT added here (it's added at the end of year usually or specific month). 
            // A common way to display merged tax is: 1-11 months normal, month 12 includes bonus. 
            // OR: we keep monthly table as "Salary Tax" and show Bonus Tax in 13th row.
            // If merged, annual tax should reflect the bracket push.

            const taxResult = calculateIIT(taxableIncome);
            // taxResult is now object { tax, rate }
            const taxLiability = taxResult.tax;
            const taxThisMonth = Math.max(0, taxLiability - accumulatedTaxPaid);

            accumulatedTaxPaid += taxThisMonth;

            const netSalary = monthSalary - totalSocialPersonal - taxThisMonth;

            months.push({
                month: m,
                period: isSecondHalf ? '下半年' : '上半年',
                salary,
                base: actualBase,
                housingBase: actualHousingBase,
                params,
                personal: {
                    pension, medical, unemployment, housing, total: totalSocialPersonal
                },
                company: {
                    pension, medical: coMedical, unemployment: coUnemployment, injury: coInjury, maternity: coMaternity, housing: coHousing, total: totalSocialCompany
                },
                tax: taxThisMonth,
                taxRate: taxResult.rate, // Store Rate
                net: netSalary,
                specialDeduction: monthlySpecialDeductionTotal,
                accumulatedTaxableIncome: taxableIncome // Useful for debugging or merged calc
            });
        }
        return months;
    });

    const yearEndBonusData = computed(() => {
        const b = Number(bonus.value) || 0;

        if (bonusMethod.value === 'standalone') {
            const res = calculateBonusTax(b);
            return {
                gross: b,
                tax: res.tax,
                rate: res.rate,
                net: b - res.tax
            };
        } else {
            // Merged Mode
            // We need to calculate Total Tax (Salary + Bonus) - Total Tax (Salary)
            // 1. Get Final Accumulated Taxable Income from Dec
            const lastMonth = monthlyData.value[11];
            if (!lastMonth) return { gross: b, tax: 0, net: b };

            const finalTaxableSalary = lastMonth.accumulatedTaxableIncome;
            const totalTaxableWithBonus = finalTaxableSalary + b;

            const finalTaxMerged = calculateIIT(totalTaxableWithBonus).tax;
            const taxAlreadyPaid = calculateIIT(finalTaxableSalary).tax;

            const taxOnBonus = Math.max(0, finalTaxMerged - taxAlreadyPaid);

            return {
                gross: b,
                tax: taxOnBonus,
                rate: calculateIIT(totalTaxableWithBonus).rate, // Marginal Rate? Or effective? Usually marginal.
                net: b - taxOnBonus
            };
        }
    });

    const annualTotals = computed(() => {
        const months = monthlyData.value;
        const reduceSum = (key, subKey) => months.reduce((acc, curr) => {
            if (subKey) return acc + curr[key][subKey];
            return acc + curr[key];
        }, 0);

        const totalSalary = reduceSum('salary');
        const totalTax = reduceSum('tax') + (yearEndBonusData.value.tax || 0);
        const totalSocialPersonal = reduceSum('personal', 'total');
        const totalSocialCompany = reduceSum('company', 'total');
        const totalNet = reduceSum('net') + (yearEndBonusData.value.net || 0);
        const totalCompanyCost = totalSalary + totalSocialCompany + (yearEndBonusData.value.gross || 0);

        return {
            totalSalary,
            totalTax,
            totalSocialPersonal,
            totalSocialCompany,
            totalNet,
            totalCompanyCost
        };
    });

    return {
        selectedYear,
        salaryInputs,
        baseInputs,
        housingInputs,
        housingFundEnabled,
        selectedDeductions,
        bonus,
        bonusMethod,
        monthlyData,
        annualTotals,
        yearEndBonusData,
        isPolicySame,
        updateDefaults
    };
}
