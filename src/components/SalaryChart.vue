
<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';
import { useResizeObserver } from '@vueuse/core';

const props = defineProps({
  data: Object
});

const chartRef = ref(null);
let chartInstance = null;

const initChart = () => {
  if (!chartRef.value) return;
  
  chartInstance = echarts.init(chartRef.value, 'dark', {
    renderer: 'canvas',
    backgroundColor: 'transparent'
  });

  updateOption();
};

const updateOption = () => {
  if (!chartInstance || !props.data) return;
  
  const formattedData = [
    { value: props.data.totalNet, name: '税后到手', itemStyle: { color: '#4caf50' } },
    { value: props.data.totalSocialPersonal, name: '个人社保/公积金', itemStyle: { color: '#ff9800' } },
    { value: props.data.totalTax, name: '个人所得税', itemStyle: { color: '#f44336' } },
    // Only show company cost if significant or requested? 
    // The user asked for "Relation between Pre-tax Salary and Constituents".
    // Usually this means Breakdown of Pre-tax.
    // Pre-tax = Net + Tax + Personal Social.
    // Company Cost is separate.
    // Let's adding Company Cost as an outer ring or separate info? 
    // Let's stick to "Where did my salary go?" pie chart.
  ];

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '0%',
      left: 'center',
      textStyle: { color: '#fff' }
    },
    series: [
      {
        name: '薪资构成',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: 'rgba(0,0,0,0.5)',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            formatter: '{b}\n{d}%',
            color: '#fff'
          }
        },
        labelLine: {
          show: false
        },
        data: formattedData
      }
    ]
  };

  chartInstance.setOption(option);
};

onMounted(() => {
  initChart();
});

watch(() => props.data, () => {
  updateOption();
}, { deep: true });

useResizeObserver(chartRef, (entries) => {
  if (chartInstance) chartInstance.resize();
});
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 300px;
}
</style>
