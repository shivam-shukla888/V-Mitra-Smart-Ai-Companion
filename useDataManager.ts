
import { useState, useEffect, useCallback } from 'react';
import { Sale, InventoryItem, SaleItem, ChatSession } from './types';
import { MOCK_INVENTORY, MOCK_SALES, MOCK_HISTORY } from './constants';

/**
 * V mitra Spring Boot Bridge
 * Acts as the API client for the VmitraSpringBootApplication backend.
 */
export const useDataManager = () => {
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [history, setHistory] = useState<ChatSession[]>(MOCK_HISTORY);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulation of a Spring Boot API call
  const recordSale = useCallback(async (itemsToSell: { name: string, quantity: number }[]) => {
    // In a real environment, this would be: 
    // fetch('/api/v1/business/record-sale', { method: 'POST', body: JSON.stringify(itemsToSell) })
    
    // Simulating Java Logic processing
    const mappings: Record<string, string> = { 
      'cheeni': 'sugar', 'doodh': 'milk', 'tel': 'oil', 
      'chawal': 'rice', 'sabun': 'soap', 'atta': 'atta'
    };

    const isMatch = (q: string, i: string) => {
      const query = q.toLowerCase();
      const item = i.toLowerCase();
      return item.includes(query) || (mappings[query] && item.includes(mappings[query]));
    };

    const saleItems: SaleItem[] = [];
    let totalAmount = 0;
    let totalCost = 0;
    const newInventory = [...inventory];
    let matched = false;

    itemsToSell.forEach(its => {
      const idx = newInventory.findIndex(i => isMatch(its.name, i.name));
      if (idx !== -1) {
        matched = true;
        const invItem = newInventory[idx];
        const qty = Math.min(its.quantity, invItem.stock);
        if (qty > 0) {
          invItem.stock -= qty;
          saleItems.push({ name: invItem.name, quantity: qty, price: invItem.price, costPrice: invItem.costPrice });
          totalAmount += invItem.price * qty;
          totalCost += invItem.costPrice * qty;
        }
      }
    });

    if (!matched) return { success: false, message: "Samaan nahi mila." };

    const newSale: Sale = { 
      id: 'T' + Date.now(), 
      date: new Date(), 
      items: saleItems, 
      totalAmount, 
      totalCost, 
      paymentMethod: 'Cash' 
    };

    setInventory(newInventory);
    setSales(prev => [newSale, ...prev]);
    setRecentActivity(prev => [{ id: Date.now(), type: 'SALE', text: `Bikri: ${newSale.items.map(i => i.name).join(', ')}`, amount: `₹${newSale.totalAmount}`, time: new Date() }, ...prev]);

    return { success: true, amount: totalAmount };
  }, [inventory]);

  const restockItem = useCallback(async (items: { name: string, quantity: number }[]) => {
    const newInventory = [...inventory];
    items.forEach(its => {
      const idx = newInventory.findIndex(i => i.name.toLowerCase().includes(its.name.toLowerCase()));
      if (idx !== -1) newInventory[idx].stock += its.quantity;
    });
    setInventory(newInventory);
    return { success: true, message: "Stock Updated via Java Service." };
  }, [inventory]);

  const getStats = useCallback(() => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => s.date.toDateString() === today).reduce((acc, s) => acc + s.totalAmount, 0);
    const todayProfit = sales.filter(s => s.date.toDateString() === today).reduce((acc, s) => acc + (s.totalAmount - s.totalCost), 0);
    const lowStockItems = inventory.filter(i => i.stock < 10).map(i => i.name);
    return { todaySales, todayProfit, lowStockItems, transactionCount: sales.length, recentActivity };
  }, [sales, inventory, recentActivity]);

  return { sales, inventory, history, recordSale, restockItem, getStats, addChatSession: (s: any) => setHistory(p => [s, ...p]), deleteSale: (id: string) => setSales(p => p.filter(s => s.id !== id)), deleteChatSession: (id: string) => setHistory(p => p.filter(h => h.id !== id)), clearChatHistory: () => setHistory([]) };
};
