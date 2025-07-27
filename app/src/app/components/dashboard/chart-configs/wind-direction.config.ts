export const windDirectionConfig = {
  series: [
    {
      animation: true,
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      min: 0,
      max: 360,
      radius: '60%',
      axisLine: {
        lineStyle: {
          width: 5
        }
      },
      detail: {
        show: false
      },
      splitNumber: 8,
      axisLabel: {
        formatter: (value: number) => {
          const directions: any = {
            0: 'N',
            45: 'NE',
            90: 'E',
            135: 'SE',
            180: 'S',
            225: 'SW',
            270: 'W',
            315: 'NW'
          };
          return directions[value] || '';
        },
        fontSize: 14
      },
      pointer: {
        show: true,
        length: '50%',
        width: 6,
        itemStyle: {
          color: 'white'
        }
      },
      data: [
        {
          value: 100,
        }
      ]
    },
    {
      animation: true,
      radius: '60%',
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      min: 0,
      max: 360,
      axisLine: {
        lineStyle: {
          width: 5
        }
      },
      splitNumber: 8,
      axisLabel: {
        formatter: (value: number) => {
          const directions: any = {
            0: 'N',
            45: 'NE',
            90: 'E',
            135: 'SE',
            180: 'S',
            225: 'SW',
            270: 'W',
            315: 'NW'
          };
          return directions[value] || '';
        },
        fontSize: 14
      },
      pointer: {
        show: true,
        length: '55%',
        width: 6,
        itemStyle: {
          color: 'red'
        }
      },
      detail: {
        show: false
      },
      data: [
        {
          value: 0,
        }
      ]
    }
  ]
};
