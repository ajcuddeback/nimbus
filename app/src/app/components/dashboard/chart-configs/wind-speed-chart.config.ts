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
        lte: 5,
        color: '#1E88E5' // Calm — medium blue (stronger than light blue)
      },
      {
        gt: 5,
        lte: 15,
        color: '#00ACC1' // Light breeze — cyan/teal
      },
      {
        gt: 15,
        lte: 25,
        color: '#FDD835' // Breezy to moderate — strong yellow
      },
      {
        gt: 25,
        lte: 40,
        color: '#FB8C00' // Strong wind — deep orange
      },
      {
        gt: 40,
        lte: 60,
        color: '#E53935' // Very strong — bold red
      },
      {
        gt: 60,
        color: '#6D4C41' // Dangerous — dark brown/red, very high contrast
      }
    ],
    outOfRange: {
      color: '#999'
    }
  }
};
