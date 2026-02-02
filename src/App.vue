
<template>
  <div class="container">
    <h1>北京薪资个税计算器 (2020-2026)</h1>
    
    <div class="grid grid-cols-2">
      <!-- Left Column: Inputs -->
      <div class="glass-card">
        <h2><span class="icon">⚙️</span>设置</h2>
        
        <div class="input-group">
          <label>年份</label>
          <select v-model.number="selectedYear">
            <option v-for="year in [2020, 2021, 2022, 2023, 2024, 2025, 2026]" :key="year" :value="year">
              {{ year }}年
            </option>
          </select>
        </div>

        <!-- Housing Fund Toggle -->
        <div class="input-group" style="display: flex; align-items: center; gap: 10px;">
           <label style="margin: 0; cursor: pointer;">
             <input type="checkbox" v-model="housingFundEnabled" style="width: auto; margin-right: 8px;"> 
             缴纳公积金
           </label>
        </div>

        <!-- Unified Input if Policy is Same -->
        <div v-if="isPolicySame">
           <div class="input-group">
            <h3>全年统一标准</h3>
            <div class="sub-group">
              <label>税前月薪 (社会平均工资: {{ period1Params.avgSalary }})</label>
              <input type="number" :value="salaryInputs.p1" @input="handleUnifiedSalary" placeholder="输入月薪">
            </div>
            <div class="sub-group">
              <label>社保基数 (最低: {{ period1Params.minBase }}, 最高: {{ period1Params.maxBase }})</label>
              <input type="number" :value="baseInputs.p1" @input="handleUnifiedBase" 
                     :min="period1Params.minBase" :max="period1Params.maxBase"
                     :placeholder="`默认: ${period1Params.avgSalary}`">
            </div>
            <!-- Housing Fund Unified Input -->
            <div class="sub-group" v-if="housingFundEnabled">
              <label>公积金基数 (最低: {{ period1Params.housingMin }}, 最高: {{ period1Params.housingMax }})</label>
              <input type="number" :value="housingInputs.p1" @input="handleUnifiedHousing" 
                     :min="period1Params.housingMin" :max="period1Params.housingMax"
                     :placeholder="`默认: ${period1Params.housingMin}`">
            </div>
          </div>
        </div>

        <!-- Split Input if Policy differs -->
        <div v-else>
          <div class="input-group">
            <h3>上半年 (1月-6月)</h3>
            <div class="sub-group">
              <label>税前月薪 (社会平均工资: {{ period1Params.avgSalary }})</label>
              <input type="number" v-model="salaryInputs.p1" placeholder="输入月薪">
            </div>
            <div class="sub-group">
              <label>社保基数 (最低: {{ period1Params.minBase }}, 最高: {{ period1Params.maxBase }})</label>
              <input type="number" v-model="baseInputs.p1" 
                     :min="period1Params.minBase" :max="period1Params.maxBase"
                     :placeholder="`默认: ${period1Params.avgSalary}`">
            </div>
            <div class="sub-group" v-if="housingFundEnabled">
              <label>公积金基数 (最低: {{ period1Params.housingMin }}, 最高: {{ period1Params.housingMax }})</label>
              <input type="number" v-model="housingInputs.p1" 
                     :min="period1Params.housingMin" :max="period1Params.housingMax"
                     :placeholder="`默认: ${period1Params.housingMin}`">
            </div>
          </div>

          <div class="input-group">
            <h3>下半年 (7月-12月)</h3>
             <div class="sub-group">
              <label>税前月薪 (社会平均工资: {{ period2Params.avgSalary }})</label>
              <input type="number" v-model="salaryInputs.p2" placeholder="输入月薪">
            </div>
            <div class="sub-group">
               <label>社保基数 (最低: {{ period2Params.minBase }}, 最高: {{ period2Params.maxBase }})</label>
              <input type="number" v-model="baseInputs.p2" 
                     :min="period2Params.minBase" :max="period2Params.maxBase"
                     :placeholder="`默认: ${period2Params.avgSalary}`">
            </div>
             <div class="sub-group" v-if="housingFundEnabled">
              <label>公积金基数 (最低: {{ period2Params.housingMin }}, 最高: {{ period2Params.housingMax }})</label>
              <input type="number" v-model="housingInputs.p2" 
                     :min="period2Params.housingMin" :max="period2Params.housingMax"
                     :placeholder="`默认: ${period2Params.housingMin}`">
            </div>
          </div>
        </div>

        <div class="input-group">
          <label>年终奖</label>
          <input type="number" v-model="bonus" placeholder="0">
        </div>
        
        <div class="input-group" v-if="bonus > 0">
           <label>年终奖计税方式</label>
           <select v-model="bonusMethod">
             <option value="standalone">单独计税 (不并入综合所得)</option>
             <option value="merged">合并计税 (并入当年综合所得)</option>
           </select>
        </div>

        <div class="input-group">
          <label>个税专项附加扣除</label>
          <div class="checkbox-group">
            <div 
              v-for="deduction in SPECIAL_DEDUCTIONS" 
              :key="deduction.id"
              class="checkbox-item"
              :class="{ active: selectedDeductions.includes(deduction.id) }"
              @click="toggleDeduction(deduction.id)"
            >
              {{ deduction.name }}
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Summary & Charts -->
      <div>
        <div class="glass-card">
          <h2><span class="icon">📊</span>年度概览</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">年度总税前</span>
              <span class="value">{{ formatCurrency(annualTotals.totalSalary + (yearEndBonusData.gross || 0)) }}</span>
            </div>
             <div class="summary-item highlight">
              <span class="label">年度总到手</span>
              <span class="value">{{ formatCurrency(annualTotals.totalNet) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">个人社保公积金</span>
              <span class="value">{{ formatCurrency(annualTotals.totalSocialPersonal) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">个人所得税</span>
              <span class="value">{{ formatCurrency(annualTotals.totalTax) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">企业总支出</span>
              <span class="value">{{ formatCurrency(annualTotals.totalCompanyCost) }}</span>
            </div>
             <div class="summary-item">
              <span class="label">企业社保缴纳</span>
              <span class="value">{{ formatCurrency(annualTotals.totalSocialCompany) }}</span>
            </div>
          </div>
          
           <SalaryChart :data="annualTotals" />
        </div>
      </div>
    </div>

    <!-- Full Width: Monthly Detail -->
    <div class="glass-card">
      <h2><span class="icon">📅</span>月度明细</h2>
      <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>月份</th>
              <th>税前薪资</th>
              <th>社保基数</th>
               <th v-if="housingFundEnabled">公积金基数</th>
              <th>个人社保</th>
              <th>个人公积金</th>
              <th>专项扣除</th>
              <th>个税税率</th> 
              <th>个税</th>
              <th>税后月薪</th>
              <th>企业缴纳</th>
              <th>企业总成本</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in monthlyData" :key="row.month">
              <td>{{ row.month }}月 <span class="tag">{{ row.period }}</span></td>
              <td>{{ formatCurrency(row.salary) }}</td>
              <td>{{ formatCurrency(row.base) }}</td>
              <td v-if="housingFundEnabled">{{ formatCurrency(row.housingBase) }}</td>
              <td>{{ formatCurrency(row.personal.total - row.personal.housing) }}</td>
              <td>{{ formatCurrency(row.personal.housing) }}</td>
              <td>{{ formatCurrency(row.specialDeduction) }}</td>
              <td>{{ (row.taxRate * 100).toFixed(0) }}%</td>
              <td>{{ formatCurrency(row.tax) }}</td>
              <td style="color: var(--success-color); font-weight: bold;">{{ formatCurrency(row.net) }}</td>
              <td>{{ formatCurrency(row.company.total) }}</td>
              <td>{{ formatCurrency(row.salary + row.company.total) }}</td>
            </tr>
            <!-- Bonus Row if exists -->
            <tr v-if="yearEndBonusData.gross > 0" class="bonus-row">
              <td>年终奖</td>
              <td>{{ formatCurrency(yearEndBonusData.gross) }}</td>
              <td>-</td>
              <td v-if="housingFundEnabled">-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
               <td>{{ (yearEndBonusData.rate * 100).toFixed(0) }}%</td> 
              <td>{{ formatCurrency(yearEndBonusData.tax) }}</td>
              <td style="color: var(--success-color); font-weight: bold;">{{ formatCurrency(yearEndBonusData.net) }}</td>
              <td>-</td>
              <td>{{ formatCurrency(yearEndBonusData.gross) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSalaryCalculation } from './composables/useSalaryCalculation';
import { SPECIAL_DEDUCTIONS, getMonthParams } from './data/constants';
import SalaryChart from './components/SalaryChart.vue';

const { 
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
  isPolicySame
} = useSalaryCalculation();

const toggleDeduction = (id) => {
  const index = selectedDeductions.value.indexOf(id);
  if (index === -1) {
    selectedDeductions.value.push(id);
  } else {
    selectedDeductions.value.splice(index, 1);
  }
};

const handleUnifiedSalary = (e) => {
  const v = Number(e.target.value);
  salaryInputs.value.p1 = v;
  salaryInputs.value.p2 = v;
};

const handleUnifiedBase = (e) => {
  const v = Number(e.target.value);
  baseInputs.value.p1 = v;
  baseInputs.value.p2 = v;
};

const handleUnifiedHousing = (e) => {
  const v = Number(e.target.value);
  housingInputs.value.p1 = v;
  housingInputs.value.p2 = v;
};

const period1Params = computed(() => getMonthParams(selectedYear.value, 1)); // Jan
const period2Params = computed(() => getMonthParams(selectedYear.value, 7)); // July

const formatCurrency = (val) => {
  return new Intl.NumberFormat('zh-CN', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
};

</script>

<style scoped>
.container {
  padding-bottom: 50px;
}
.sub-group {
    background: rgba(255,255,255,0.05);
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 12px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.summary-item {
  display: flex;
  flex-direction: column;
}
.summary-item .label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.summary-item .value {
  font-size: 1.2rem;
  font-weight: bold;
}
.highlight .value {
  color: var(--success-color);
  font-size: 1.4rem;
}
.bonus-row {
  background: rgba(255, 215, 0, 0.1);
}
.bonus-row td {
  color: #ffd700;
}
</style>
