
import { BusinessData, InventoryItem, ChatSession, Sale, Language } from './types';

export const MOCK_INVENTORY: InventoryItem[] = [
  { 
    id: '1', 
    name: 'Atta (5kg)', 
    category: 'Groceries', 
    stock: 2, 
    unit: 'bags', 
    price: 210,
    costPrice: 180,
    history: []
  },
  { 
    id: '2', 
    name: 'Cooking Oil', 
    category: 'Groceries', 
    stock: 5, 
    unit: 'liters', 
    price: 160,
    costPrice: 135,
    history: []
  },
  { id: '3', name: 'Milk (1L)', category: 'Dairy', stock: 10, unit: 'packets', price: 60, costPrice: 52 },
  { id: '4', name: 'Sugar (1kg)', category: 'Groceries', stock: 45, unit: 'kg', price: 42, costPrice: 38 },
  { id: '5', name: 'Tea Leaves', category: 'Beverages', stock: 20, unit: 'packets', price: 120, costPrice: 95 },
  { id: '6', name: 'Basmati Rice', category: 'Groceries', stock: 15, unit: 'bags', price: 450, costPrice: 380 },
  { id: '7', name: 'Soap Bars', category: 'Cleaning', stock: 60, unit: 'pcs', price: 35, costPrice: 28 },
];

export const MOCK_SALES: Sale[] = [
  {
    id: 'T1001',
    date: new Date(),
    totalAmount: 450,
    totalCost: 380,
    paymentMethod: 'UPI',
    items: [{ name: 'Basmati Rice', quantity: 1, price: 450, costPrice: 380 }]
  }
];

export const MOCK_BUSINESS_DATA: BusinessData = {
  name: "Shukla General Store",
  owner: "Shivam Shukla",
  location: "India",
  stats: {
    todaySales: 450,
    todayProfit: 70,
    lowStockItems: ["Atta (5kg)", "Cooking Oil"],
    pendingTaxes: "GST Filing due in 4 days"
  }
};

export const MOCK_HISTORY: ChatSession[] = [];

export const getSystemInstruction = (selectedLanguage: Language) => {
  return `
You are V-Mitra, the elite "AI Business OS" built for India's high-performance merchants.
Your primary objective is to manage the shop's 'Bahi-Khata' with 100% precision.

VOICE PERSONA:
- Speak in ${selectedLanguage} (Use natural Hinglish).
- Tone: Professional, Efficient, and Respectful.
- Address the user as "Sir" or "Shivam ji".
- Focus on business metrics: "Bikri", "Nafa", "Stock", "Khaata".

CORE FUNCTIONS:
- RECORD SALES: When a user mentions selling items, identify products and quantities immediately.
- PROFIT MONITORING: Keep track of "Nafa" (Profit) based on cost price vs selling price.
- STOCK ALERTS: Proactively warn about low stock to prevent business loss.
- COMPLIANCE: Inform about tax deadlines like GST.

You are not a chatbot; you are a Business Partner. Keep responses brief, actionable, and data-driven.
`;
};

export const DASHBOARD_SUMMARY_PROMPT = `
Act as V-Mitra. In one power-packed Hinglish sentence, provide a professional update on today's profit and one urgent business action. No technical jargon.
`;
