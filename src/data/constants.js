
// Beijing Social Security & Housing Fund Constants (2020-2026)
// Data reflects the "Social Security Year" which typically runs from July to June of the next year.
// Adjustments are made to map these to Calendar Years/Months.

// Social Security Years (July X -> June X+1)
// Avg: The average salary used to determine the base (usually the previous year's full-caliber avg salary).
// Min/Max: The official lower/upper limits for Pension/Unemployment/etc.

export const SOCIAL_SECURITY_YEARS = {
  // 2019 Social Security Year (July 2019 - June 2020)
  2019: { min: 3613, max: 23565, avg: 7855 },

  // 2020 Social Security Year (July 2020 - June 2021)
  2020: { min: 3613, max: 26541, avg: 8847 },

  // 2021 Social Security Year (July 2021 - June 2022)
  2021: { min: 5360, max: 28221, avg: 9407 },

  // 2022 Social Security Year (July 2022 - June 2023)
  2022: { min: 5869, max: 31884, avg: 10628 },

  // 2023 Social Security Year (July 2023 - June 2024)
  2023: { min: 6326, max: 33891, avg: 11297 },

  // 2024 Social Security Year (July 2024 - June 2025)
  2024: { min: 6821, max: 35283, avg: 11761 },

  // 2025 Social Security Year (July 2025 - June 2026)
  2025: { min: 7162, max: 35811, avg: 11937 },

  // 2026 Social Security Year (July 2026 - June 2027)
  // Strategy: Fallback to 2025 standards as requested ("按旧文件展示和计算").
  2026: { min: 7162, max: 35811, avg: 11937 },
};

// Housing Fund Years (Typically July X -> June X+1)
export const HOUSING_FUND_YEARS = {
  2019: { min: 2200, max: 27786 },
  2020: { min: 2200, max: 27786 },
  2021: { min: 2320, max: 28221 },
  2022: { min: 2320, max: 31884 },
  2023: { min: 2420, max: 33891 },
  2024: { min: 2420, max: 35283 },
  2025: { min: 2540, max: 35811 },
  2026: { min: 2540, max: 35811 },
};


// Rates (Beijing Standard)
export const RATES = {
  pension: { self: 0.08, company: 0.16 }, // 养老
  medical: { self: 0.02, company: 0.09 }, // 医疗 (2% + 3元 usually, but we stick to % for now, maybe add fixed later)
  unemployment: { self: 0.005, company: 0.005 }, // 失业 (adjusted in recent years to 0.5% each)
  injury: { self: 0, company: 0.002 }, // 工伤 (varies by industry, 0.2% - 1.9%, using min/common)
  maternity: { self: 0, company: 0.008 }, // 生育 (often merged with medical, but Beijing still tracks? Merged into Med in many places, but keep separate if specific)
  housing: { self: 0.12, company: 0.12 }, // Public Housing Fund Rate (Standard Max). User can adjust base, but rate is often fixed by company policy (5-12%). We use 12% as default coeff.
};

export const FIXED_MEDICAL_ADDITION = 3; // 3 RMB big amount medical insurance

export const SPECIAL_DEDUCTIONS = [
  { id: 'children', name: '子女教育', amount: 2000, label: '2000元/孩/月' },
  { id: 'elderly', name: '赡养老人', amount: 3000, label: '3000元/月' }, // Max
  { id: 'infant', name: '3岁以下婴幼儿照护', amount: 2000, label: '2000元/孩/月' },
  { id: 'housing_loan', name: '住房贷款利息', amount: 1000, label: '1000元/月' },
  { id: 'housing_rent', name: '住房租金', amount: 1500, label: '1500元/月 (北京)' },
  { id: 'continuing_edu_deg', name: '继续教育(学历)', amount: 400, label: '400元/月' },
  { id: 'continuing_edu_pro', name: '继续教育(职业资格)', amount: 3600, label: '3600元/年', isYearly: true },
];

export function getMonthParams(year, month) {
  let ssYearKey;
  if (month <= 6) {
    ssYearKey = year - 1;
  } else {
    ssYearKey = year;
  }

  // Fallback to 2026/2025 if data missing
  const ssData = SOCIAL_SECURITY_YEARS[ssYearKey] || SOCIAL_SECURITY_YEARS[2026];
  const hfData = HOUSING_FUND_YEARS[ssYearKey] || HOUSING_FUND_YEARS[2026];

  return {
    minBase: ssData.min,
    maxBase: ssData.max,
    avgSalary: ssData.avg,
    housingMin: hfData.min,
    housingMax: hfData.max,
    ssYear: ssYearKey
  };
}

export function calculateIIT(accumulatedTaxableIncome) {
  // 2019 New IIT Tax Brackets (Yearly Cumulative)
  // Level | Income Range | Rate | Deduction
  const brackets = [
    { limit: 36000, rate: 0.03, deduction: 0 },
    { limit: 144000, rate: 0.10, deduction: 2520 },
    { limit: 300000, rate: 0.20, deduction: 16920 },
    { limit: 420000, rate: 0.25, deduction: 31920 },
    { limit: 660000, rate: 0.30, deduction: 52920 },
    { limit: 960000, rate: 0.35, deduction: 85920 },
    { limit: Infinity, rate: 0.45, deduction: 181920 },
  ];

  if (accumulatedTaxableIncome <= 0) {
    return { tax: 0, rate: 0, deduction: 0 };
  }

  for (const b of brackets) {
    if (accumulatedTaxableIncome <= b.limit) {
      return {
        tax: accumulatedTaxableIncome * b.rate - b.deduction,
        rate: b.rate,
        deduction: b.deduction
      };
    }
  }
  return { tax: 0, rate: 0, deduction: 0 };
}

export function calculateBonusTax(bonus) {
  if (bonus <= 0) return { tax: 0, rate: 0, deduction: 0 };

  const monthlyAvg = bonus / 12;
  const brackets = [
    { limit: 3000, rate: 0.03, deduction: 0 },
    { limit: 12000, rate: 0.10, deduction: 210 },
    { limit: 25000, rate: 0.20, deduction: 1410 },
    { limit: 35000, rate: 0.25, deduction: 2660 },
    { limit: 55000, rate: 0.30, deduction: 4410 },
    { limit: 80000, rate: 0.35, deduction: 7160 },
    { limit: Infinity, rate: 0.45, deduction: 15160 },
  ];

  for (const b of brackets) {
    if (monthlyAvg <= b.limit) {
      return {
        tax: bonus * b.rate - b.deduction,
        rate: b.rate,
        deduction: b.deduction
      };
    }
  }
}
