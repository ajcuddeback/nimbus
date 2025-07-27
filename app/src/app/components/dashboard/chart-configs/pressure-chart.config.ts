export const pressureChartConfig = {
  toolbox: {
    show: true,
    feature: {
      saveAsImage: {
        show: true,
        type: 'png'
      },
    }
  },
  legend: {
    align: 'left'
  },
  tooltip: {
    show: true,
    formatter: '{b}: {c} in'
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value} in'
    }
  },
  series: [
    {
      data: [],
      type: 'line',
      smooth: true,
    },
  ],
  visualMap: {
    show: false,
    pieces: [
      { lte: 970, color: '#b71c1c'},
      { gte: 971, lte: 990, color: '#f57c00' },
      { gte: 991, lte: 1010, color: '#2196f3' },
      { gte: 1011, lte: 1030, color: '#4caf50' },
      { gte: 1031, color: '#0d47a1' }
    ],
    outOfRange: {
      color: '#999'
    }
  }
};
