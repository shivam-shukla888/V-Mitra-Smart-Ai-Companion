
import React, { useState } from 'react';
import { X, Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle2 } from 'lucide-react';
import { InventoryItem } from '../types';

interface ManualSaleModalProps {
  inventory: InventoryItem[];
  onClose: () => void;
  onSubmit: (items: { name: string, quantity: number }[]) => void;
}

const ManualSaleModal: React.FC<ManualSaleModalProps> = ({ inventory, onClose, onSubmit }) => {
  const [cart, setCart] = useState<{ id: string, name: string, quantity: number, price: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (item: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, quantity: 1, price: item.price }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = () => {
    if (cart.length === 0) return;
    onSubmit(cart.map(i => ({ name: i.name, quantity: i.quantity })));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-12">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={onClose}></div>
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-slate-900 rounded-[64px] shadow-3xl flex flex-col md:flex-row overflow-hidden border border-white/10">
        
        <div className="flex-1 flex flex-col min-h-0 border-r border-white/5 bg-slate-900/40">
          <div className="p-12 border-b border-white/5">
            <h2 className="text-4xl font-black text-white tracking-tighter mb-8 leading-none">Catalog Hisaab</h2>
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
              <input 
                type="text" 
                placeholder="Samaan ka naam search karein..." 
                className="w-full pl-16 pr-8 py-5 bg-slate-800 rounded-3xl focus:outline-none focus:border-indigo-500/50 font-bold text-white text-lg placeholder:text-slate-600 shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInventory.map(item => (
              <button key={item.id} onClick={() => addToCart(item)} className="p-6 bg-white/5 border border-white/5 rounded-[44px] hover:border-indigo-500 hover:bg-white/10 transition-all text-left flex flex-col justify-between active:scale-95 shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-slate-800 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{item.category}</span>
                    <span className={`text-[10px] font-black uppercase ${item.stock < 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {item.stock} Baki Hai
                    </span>
                  </div>
                  <p className="font-black text-white text-xl leading-tight">{item.name}</p>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <p className="font-black text-2xl text-white">₹{item.price}</p>
                  <div className="w-10 h-10 bg-white text-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
                    <Plus size={20} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full md:w-[440px] bg-slate-950 flex flex-col shrink-0">
          <div className="p-12 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
            <h3 className="text-2xl font-black text-white flex items-center gap-4 tracking-tighter">
              <ShoppingCart size={28} className="text-indigo-400" />
              Final Bill
            </h3>
            <button onClick={onClose} className="p-3 bg-white/5 text-slate-500 hover:text-white rounded-2xl border border-white/5">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
                <ShoppingCart size={80} className="mb-6 text-white" />
                <p className="font-black text-xl uppercase tracking-widest text-white">Bill Empty Hai</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-slate-900 p-6 rounded-[36px] border border-white/10 shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <p className="font-black text-white text-lg leading-tight flex-1">{item.name}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-slate-600 hover:text-rose-500 p-1">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-2 px-4 border border-white/5">
                      <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-white"><Minus size={18} /></button>
                      <span className="font-black text-lg text-white w-6 text-center">{item.quantity}</span>
                      <button onClick={() => addToCart(inventory.find(i => i.id === item.id)!)} className="w-8 h-8 flex items-center justify-center text-white"><Plus size={18} /></button>
                    </div>
                    <p className="font-black text-2xl text-indigo-400 tracking-tighter">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-12 bg-slate-900/80 border-t border-white/5 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-10">
              <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Total Billing</p>
              <p className="text-5xl font-black text-white tracking-tighter leading-none">₹{total}</p>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={cart.length === 0}
              className={`w-full py-7 rounded-[32px] font-black text-xl flex items-center justify-center gap-4 transition-all active:scale-95 ${
                cart.length > 0 ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-white/5 text-slate-700 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 size={28} />
              Save aur Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualSaleModal;
