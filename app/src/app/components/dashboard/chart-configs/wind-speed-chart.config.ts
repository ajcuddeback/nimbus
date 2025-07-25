export const windSpeedChartConfig = {
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
    pieces: [
      {
        gt: 0,
        lte: 1,
        color: '#93CE07'
      },
      {
        gt: 1,
        lte: 2,
        color: '#FBDB0F'
      },
      {
        gt: 2,
        lte: 3,
        color: '#FC7D02'
      },
      {
        gt: 3,
        lte: 4,
        color: '#FD0100'
      },
      {
        gt: 4,
        lte: 5,
        color: '#AA069F'
      },
      {
        gt: 5,
        color: '#AC3B2A'
      },
    ],
    outOfRange: {
      color: '#999'
    }
  }
};
