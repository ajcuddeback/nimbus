export const humidityChartConfig = {
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
    align: 'left',
  },
  tooltip: {
    show: true,
    formatter: '{b}: {c}%'
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value}%',
      fontSize: 10
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
    top: 50,
    right: 10,
    pieces:[
      {
        gt: 0,
        lte: 20,
        color: '#F4D03F'
      },
      {
        gt: 20,
        lte: 40,
        color: '#F5B041'
      },
      {
        gt: 40,
        lte: 60,
        color: '#58D68D'
      },
      {
        gt: 60,
        lte: 80,
        color: '#5DADE2'
      },
      {
        gt: 80,
        lte: 100,
        color: '#2874A6'
      }
    ],
    outOfRange: {
      color: '#999'
    }
  }
};
