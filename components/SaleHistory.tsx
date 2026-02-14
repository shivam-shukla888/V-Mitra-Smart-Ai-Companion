
import React, { useState } from 'react';
import { Receipt, Calendar, CreditCard, ChevronDown, ChevronUp, Search, Download, Trash2, Filter, Info, ShieldCheck } from 'lucide-react';
import { Sale } from '../types';

interface SaleHistoryProps {
  sales: Sale[];
  onDeleteSale?: (id: string) => void;
}

const SaleHistory: React.FC<SaleHistoryProps> = ({ sales, onDeleteSale }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative w-full md:w-[450px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Pichli entries search karein..." 
            className="w-full pl-12 pr-6 py-4 bg-slate-900 border border-white/10 rounded-[24px] transition-all text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 border border-white/5 rounded-2xl text-slate-300 font-black text-sm uppercase">
            <Filter size={18} /> 
            <span className="hidden lg:inline">Filter</span>
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase">
            <Download size={18} /> 
            <span className="hidden lg:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="grid gap-5">
        {filteredSales.length === 0 ? (
          <div className="py-32 text-center bg-slate-900 rounded-[40px] border-2 border-dashed border-white/5">
            <h3 className="text-xl font-black text-slate-500 mb-2 uppercase tracking-widest">Koi Bikri Nahi Mili</h3>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div key={sale.id} className={`bg-slate-900 rounded-[36px] border border-white/5 shadow-sm overflow-hidden transition-all ${expandedId === sale.id ? 'ring-2 ring-indigo-500 shadow-2xl border-indigo-500/50' : ''}`}>
              <div className={`p-6 md:p-8 flex items-center gap-6 cursor-pointer transition-colors ${expandedId === sale.id ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`} onClick={() => toggleExpand(sale.id)}>
                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg shrink-0 ${sale.paymentMethod === 'UPI' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {sale.paymentMethod === 'UPI' ? <CreditCard size={28} /> : <Receipt size={28} />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-white font-black text-xl tracking-tight truncate">{sale.items.map(i => i.name).join(', ')}</h4>
                  <p className="text-slate-500 text-xs font-bold uppercase flex items-center gap-2 mt-1">
                    <Calendar size={12} className="text-indigo-500" />
                    {sale.date.toLocaleDateString()} at {sale.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-black text-white tracking-tighter">₹{sale.totalAmount}</p>
                  <p className="text-[10px] font-black uppercase text-indigo-400 mt-1">{expandedId === sale.id ? 'Band karein' : 'Bill Dekhein'}</p>
                </div>
              </div>

              {expandedId === sale.id && (
                <div className="px-8 pb-8 pt-2">
                  <div className="bg-white/5 rounded-[32px] p-8 border border-white/5 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                         <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Full Bill Details</h5>
                         <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">{sale.paymentMethod} Payment</p>
                      </div>
                      <div className="space-y-4 mb-8">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start">
                            <p className="text-base font-black text-white">{item.name} <span className="text-xs text-slate-500 font-bold ml-2">{item.quantity} qty</span></p>
                            <p className="font-black text-white text-lg">₹{item.quantity * item.price}</p>
                          </div>
                        ))}
                      </div>
                      <div className="pt-6 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <p className="text-lg font-black text-white">Total Bill</p>
                          <p className="text-3xl font-black text-indigo-400">₹{sale.totalAmount}</p>
                        </div>
                      </div>
                      <div className="mt-8 flex gap-3">
                         <button className="flex-1 py-4 bg-slate-800 text-white border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Download Bill</button>
                         {onDeleteSale && (
                           <button onClick={(e) => { e.stopPropagation(); onDeleteSale(sale.id); }} className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">
                             <Trash2 size={20} />
                           </button>
                         )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SaleHistory;
