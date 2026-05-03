
export type InvestmentType = 'Stock' | 'Bond' | 'Mutual Fund' | 'ETF' | 'Crypto' | 'Real Estate';

export interface Investment {
  id: string;
  name: string;
  ticker: string;
  type: InvestmentType;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  category: string;
}

export interface PortfolioStats {
  totalValue: number;
  totalGain: number;
  totalGainPercentage: number;
  dailyGain: number;
  dailyGainPercentage: number;
}

export interface PerformanceDataPoint {
  date: string;
  value: number;
}
