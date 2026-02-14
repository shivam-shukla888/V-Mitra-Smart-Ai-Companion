
import React, { useState } from 'react';
import { Search, Plus, Filter, MoreVertical, AlertTriangle, History, X, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryProps {
  inventory: InventoryItem[];
}

const Inventory: React.FC<InventoryProps> = ({ inventory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const filtered = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Samaan search karein..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all text-white font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 rounded-2xl text-slate-300 font-bold hover:bg-slate-700 transition-all">
            <Filter size={18} /> Filter
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 gradient-bg text-white rounded-2xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
            <Plus size={18} /> Naya Samaan
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[32px] border border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Stock Kitna Hai</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">ID: {item.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{item.stock} <span className="text-slate-500 text-xs font-medium">{item.unit}</span></p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">₹{item.price}</p>
                  </td>
                  <td className="px-6 py-4">
                    {item.stock < 10 ? (
                      <span className="flex items-center gap-1.5 text-rose-500 text-xs font-black uppercase">
                        <AlertTriangle size={14} /> Low Stock
                      </span>
                    ) : (
                      <span className="text-emerald-500 text-xs font-black uppercase">Stock Mein Hai</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelectedItem(item)} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all">
                        <History size={18} />
                      </button>
                      <button className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedItem(null)}></div>
          <div className="relative w-full max-w-md h-full bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-white/10">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div>
                <h3 className="text-xl font-black text-white">Stock History</h3>
                <p className="text-sm text-indigo-400 font-bold">{selectedItem.name}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-white/5">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {!selectedItem.history || selectedItem.history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <p className="font-black text-slate-500 uppercase tracking-[0.2em] text-xs">Koi history nahi mili.</p>
                </div>
              ) : (
                <div className="relative space-y-8">
                  <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-white/5"></div>
                  {selectedItem.history.map((adjustment) => (
                    <div key={adjustment.id} className="relative flex gap-6">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 z-10 ${adjustment.type === 'Restock' ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                        {adjustment.type === 'Restock' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </div>
                      <div className="flex-1 pb-4 border-b border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-black text-white">{adjustment.type}</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase">{adjustment.date.toLocaleDateString()}</p>
                        </div>
                        <p className={`text-sm font-black ${adjustment.change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {adjustment.change > 0 ? '+' : ''}{adjustment.change} {selectedItem.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-8 bg-white/5 border-t border-white/5">
              <button className="w-full py-5 gradient-bg text-white rounded-2xl font-black uppercase tracking-widest text-sm">Manual Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
