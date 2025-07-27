export const tempChartConfigF = {
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
    padding: [
      5, 0, 5, 30
    ]
  },
  tooltip: {
    show: true,
    formatter: '{b}: {c}°F'
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value}°F',
      fontSize: 10
    },
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
    pieces: [
      {
        gt: -Infinity,
        lte: 32,
        color: '#00BFFF'
      },
      {
        gt: 32,
        lte: 50,
        color: '#1E90FF'
      },
      {
        gt: 50,
        lte: 65,
        color: '#93CE07'
      },
      {
        gt: 65,
        lte: 75,
        color: '#FBDB0F'
      },
      {
        gt: 75,
        lte: 85,
        color: '#FC7D02'
      },
      {
        gt: 85,
        lte: 95,
        color: '#FD0100'
      },
      {
        gt: 95,
        color: '#8B0000'
      }
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

