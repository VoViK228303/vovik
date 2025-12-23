import { Stock, NewsItem } from './types.ts';

export const INITIAL_CASH = 1000;

export const INITIAL_STOCKS: Stock[] = [
  { symbol: 'SBER', name: 'Sberbank', price: 275.43, change: 1.25, changePercent: 0.72, volume: 54000000, high: 278.10, low: 272.50, volatility: 0.005 },
  { symbol: 'GAZP', name: 'Gazprom', price: 168.90, change: -0.45, changePercent: -0.32, volume: 22000000, high: 170.00, low: 168.00, volatility: 0.004 },
  { symbol: 'LKOH', name: 'Lukoil', price: 7356.20, change: 25.10, changePercent: 0.59, volume: 1800000, high: 7380.50, low: 7300.00, volatility: 0.006 },
  { symbol: 'YNDX', name: 'Yandex', price: 3242.50, change: -32.20, changePercent: -1.30, volume: 950000, high: 3280.00, low: 3200.00, volatility: 0.008 },
  { symbol: 'ROSN', name: 'Rosneft', price: 585.30, change: 2.80, changePercent: 0.55, volume: 3800000, high: 590.20, low: 580.50, volatility: 0.005 },
  { symbol: 'NVTK', name: 'Novatek', price: 1460.15, change: 15.40, changePercent: 1.18, volume: 4200000, high: 1480.00, low: 1450.00, volatility: 0.007 },
];

export const INITIAL_NEWS: NewsItem[] = [
  { id: '1', title: 'ЦБ РФ сохранил ключевую ставку без изменений', type: 'INFO', timestamp: Date.now() - 10000000 },
  { id: '2', title: 'Сбербанк отчитался о рекордной прибыли', type: 'BULLISH', timestamp: Date.now() - 5000000 },
];
