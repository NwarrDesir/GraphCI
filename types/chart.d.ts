import { ChartOptions } from 'chart.js';

declare module 'chart.js' {
  interface ChartOptions {
    scales?: any;
  }
}
