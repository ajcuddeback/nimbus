export const windSpeedChartConfig = {
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
    formatter: '{b}: {c} mph'
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value} mph'
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
    top: 50,
    right: 10,
    show: false,
    pieces: [
      {
        gt: 0,
        lte: 5,
        color: '#1E88E5'
      },
      {
        gt: 5,
        lte: 15,
        color: '#00ACC1'
      },
      {
        gt: 15,
        lte: 25,
        color: '#FDD835'
      },
      {
        gt: 25,
        lte: 40,
        color: '#FB8C00'
      },
      {
        gt: 40,
        lte: 60,
        color: '#E53935'
      },
      {
        gt: 60,
        color: '#6D4C41'
      }
    ],
    outOfRange: {
      color: '#999'
    }
  }
};
