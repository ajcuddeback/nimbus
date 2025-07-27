export const rainfallChartConfig = {
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
    formatter: '{b}: {c}mm'
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value}mm'
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
        { lte: 0.2, color: '#607D8B' },
        { gte: 0.21, lte: 2.5, color: '#2196F3' },
        { gte: 2.51, lte: 7.5, color: '#1976D2' },
        { gte: 7.51, lte: 15, color: '#0D47A1' },
        { gte: 15.01, lte: 30, color: '#4527A0' },
        { gte: 30.01, lte: 50, color: '#6A1B9A' },
        { gte: 50.01, color: '#B71C1C' }
    ],
    outOfRange: {
      color: '#999'
    }
  }
};

export const tempChartConfigC = {
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
    formatter: '{b}: {c}°C'
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value}°C'
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
    pieces: [
      {
        gt: -Infinity,
        lte: 0, // Freezing and below
        color: '#00BFFF' // Deep Sky Blue
      },
      {
        gt: 0,
        lte: 10, // Cold
        color: '#1E90FF' // Dodger Blue
      },
      {
        gt: 10,
        lte: 18, // Cool
        color: '#93CE07' // Yellow-Green
      },
      {
        gt: 18,
        lte: 24, // Pleasant
        color: '#FBDB0F' // Soft Yellow
      },
      {
        gt: 24,
        lte: 29, // Warm
        color: '#FC7D02' // Orange
      },
      {
        gt: 29,
        lte: 35, // Hot
        color: '#FD0100' // Bright Red
      },
      {
        gt: 35, // Very hot
        color: '#8B0000' // Dark Red
      }
    ],
    outOfRange: {
      color: '#999'
    }
  }
};

