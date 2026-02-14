
export enum Language {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  HINGLISH = 'Hinglish',
  GUJARATI = 'Gujarati',
  TAMIL = 'Tamil',
  BENGALI = 'Bengali',
  MARATHI = 'Marathi'
}

export interface BusinessStats {
  todaySales: number;
  todayProfit: number;
  lowStockItems: string[];
  pendingTaxes: string;
}

export interface TranscriptionItem {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  feedback?: 'positive' | 'negative';
}

export interface BusinessData {
  name: string;
  owner: string;
  location: string;
  stats: BusinessStats;
}

export interface StockAdjustment {
  id: string;
  date: Date;
  change: number;
  type: 'Sale' | 'Restock' | 'Correction';
  newStock: number;
  note?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  price: number;
  costPrice: number; // Added for profit calculation
  history?: StockAdjustment[];
}

export interface ChatSession {
  id: string;
  date: Date;
  summary: string;
  messages: TranscriptionItem[];
}

export interface SaleItem {
  name: string;
  quantity: number;
  price: number;
  costPrice?: number; // Optional: cost at time of sale
}

export interface Sale {
  id: string;
  date: Date;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number; // Added for accurate profit
  paymentMethod: 'Cash' | 'UPI' | 'Card';
}
