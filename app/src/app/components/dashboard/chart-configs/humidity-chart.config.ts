export const humidityChartConfig = {
  legend: {
    align: 'left'
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value'
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
