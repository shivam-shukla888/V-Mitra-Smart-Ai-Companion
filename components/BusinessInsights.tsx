
import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Package, AlertCircle, Clock, RefreshCcw, Sparkles, ShoppingCart, History, CheckCircle2, Plus, Calculator, Mic, BarChart as BarChartIcon, AlertTriangle, Key, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DASHBOARD_SUMMARY_PROMPT } from '../constants';
import { Sale, InventoryItem } from '../types';

interface BusinessInsightsProps {
  stats: {
    todaySales: number;
    todayProfit: number;
    lowStockItems: string[];
    transactionCount: number;
    recentActivity: any[];
  };
  sales: Sale[];
  inventory: InventoryItem[];
  onQuickSale: (items: { name: string, quantity: number }[]) => void;
  onOpenManualSale: () => void;
  onQuotaError?: () => void;
}

const BusinessInsights: React.FC<BusinessInsightsProps> = ({ stats, sales, inventory, onQuickSale, onOpenManualSale, onQuotaError }) => {
  const [aiSummary, setAiSummary] = useState<string>('Bahi-khata analyze ho raha hai...');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const retryCountRef = useRef(0);

  const fetchAiSummary = async () => {
    setIsSyncing(true);
    setIsQuotaExceeded(false);
    try {
      // @google/genai initialization fix: strictly use process.env.API_KEY per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${DASHBOARD_SUMMARY_PROMPT}. Stats: Sales ₹${stats.todaySales}, Profit ₹${stats.todayProfit}, Alerts: ${stats.lowStockItems.join(', ')}`,
      });
      setAiSummary(response.text || `Nafa ₹${stats.todayProfit} hai. Hisaab clear hai!`);
      retryCountRef.current = 0;
    } catch (e: any) {
      const errorMsg = e.message || "";
      // Handle project/API key verification issues by triggering re-selection
      if (errorMsg.includes("Requested entity was not found.")) {
        onQuotaError?.();
        return;
      }
      if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota")) {
        setIsQuotaExceeded(true);
        setAiSummary("AI Busy hai. Unlimited use ke liye apni Pro Key lagayein.");
        if (retryCountRef.current < 2) {
          retryCountRef.current++;
          setTimeout(fetchAiSummary, Math.pow(2, retryCountRef.current) * 2000);
        }
      } else {
        setAiSummary(`Sale: ₹${stats.todaySales} | Nafa: ₹${stats.todayProfit}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchAiSummary();
  }, [stats.todaySales]);

  const handleManualRetry = () => {
    retryCountRef.current = 0;
    fetchAiSummary();
  };

  const chartData = [
    { name: '9 AM', sales: stats.todaySales * 0.2 },
    { name: '12 PM', sales: stats.todaySales * 0.45 },
    { name: '3 PM', sales: stats.todaySales * 0.7 },
    { name: '6 PM', sales: stats.todaySales * 0.9 },
    { name: 'LIVE', sales: stats.todaySales },
  ];

  const quickItems = inventory.slice(0, 4);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 mt-4">
      {isQuotaExceeded && (
        <div className="bg-amber-600 p-8 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl animate-in slide-in-from-top-6 border-2 border-amber-400/30">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <div>
              <p className="font-black text-xl uppercase tracking-tight leading-none">AI Busy (Quota Limit)</p>
              <p className="text-amber-100 font-medium opacity-90 mt-1">Unlimited use ke liye 'Switch Key' dabayein.</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={handleManualRetry}
              className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Retry
            </button>
            <button 
              onClick={onQuotaError}
              className="flex-1 md:flex-none bg-white text-amber-700 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-50 shadow-xl transition-all"
            >
              Switch Key
            </button>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden bg-slate-900 p-10 rounded-[48px] border border-indigo-500/10 shadow-3xl min-h-[200px] flex flex-col justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1605371924599-2d0365da1ae0?auto=format&fit=crop&q=40&w=1200" 
            className="w-full h-full object-cover opacity-10"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Mic size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight leading-none">V-Mitra Guide</h3>
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1">Voice Commands Try Karein</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <VoiceCommandCard command="Aaj kitna sale hua?" label="Sales Status" />
            <VoiceCommandCard command="Nafa kya bana?" label="Profit Check" />
            <VoiceCommandCard command="Stock kiska low hai?" label="Stock Alert" />
            <VoiceCommandCard command="Kaisa chal raha hai?" label="Overview" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-slate-900/50 p-10 rounded-[56px] border border-white/5 shadow-2xl min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <BarChartIcon size={24} className="text-indigo-400" />
                Bikri ka haal
              </h3>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">Aaj ki real-time report</p>
            </div>
            <div className="bg-indigo-500/10 px-5 py-2 rounded-full border border-indigo-500/20 flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Live Data</span>
            </div>
          </div>
          <div className="flex-1 w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} fontWeight="800" axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} fontWeight="800" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px' }} />
                <Area type="monotone" dataKey="sales" stroke="#818cf8" strokeWidth={5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-8">
          <StatCard label="Aaj ki Bikri" value={`₹${stats.todaySales}`} trend={`${stats.transactionCount} Bills`} color="indigo" icon={<TrendingUp />} />
          <StatCard label="Kul Nafa (Profit)" value={`₹${stats.todayProfit}`} trend="Calculated" color="emerald" icon={<Package />} />
        </div>
      </div>

      <div className={`relative overflow-hidden rounded-[56px] p-10 text-white shadow-3xl group border transition-all ${isQuotaExceeded ? 'bg-amber-600 border-amber-400/20' : 'bg-indigo-600 border-indigo-400/20'}`}>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-white/20 rounded-[28px] flex items-center justify-center backdrop-blur-xl border border-white/40 shrink-0 shadow-2xl">
              {isQuotaExceeded ? <Key className="text-white" size={32} /> : <Sparkles className={isSyncing ? 'animate-pulse' : 'text-white'} size={32} />}
            </div>
            <div className="text-center md:text-left">
              <p className="text-indigo-200 text-[11px] font-black uppercase tracking-[0.3em] mb-2">V-Mitra AI Report</p>
              <h3 className="text-2xl md:text-3xl font-black leading-tight max-w-xl tracking-tight">{isSyncing ? 'Soch raha hoon...' : aiSummary}</h3>
            </div>
          </div>
          <button onClick={fetchAiSummary} disabled={isSyncing} className="bg-white text-indigo-600 p-6 rounded-3xl hover:bg-slate-100 transition-all active:scale-90 shadow-2xl disabled:opacity-50">
            <RefreshCcw size={28} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard label="Stock Alert" value={stats.lowStockItems.length} trend="Items Low" color="amber" icon={<AlertCircle />} />
        <StatCard label="Tax Filing" value="4 Days" trend="GST Due" color="rose" icon={<Clock />} />
        <StatCard label="Naya Bill" value="Manual" trend="Entry" color="indigo" icon={<Calculator />} onClick={onOpenManualSale} />
        <StatCard label="Purane Logs" value="History" trend="Logs" color="emerald" icon={<History />} />
      </div>

      <section className="bg-slate-900/40 p-10 rounded-[56px] border border-white/5 shadow-inner">
        <div className="flex items-center justify-between mb-10 px-4">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <Plus size={24} className="text-indigo-400" />
              Quick Bill
            </h3>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mt-1">Frequent Items</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {quickItems.map(item => (
            <button key={item.id} onClick={() => onQuickSale([{ name: item.name, quantity: 1 }])} className="flex flex-col items-start p-8 bg-white/5 border border-white/5 rounded-[40px] hover:bg-indigo-600 hover:border-indigo-600 transition-all group active:scale-95 shadow-xl">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:text-white transition-all">
                <Plus size={22} />
              </div>
              <p className="font-black text-lg text-white mb-1">{item.name}</p>
              <p className="text-sm font-bold text-slate-500 group-hover:text-white/80">₹{item.price}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/60 p-10 rounded-[56px] border border-white/5 shadow-2xl">
        <div className="flex items-center justify-between mb-12 px-4 relative z-10">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <History size={24} className="text-indigo-400" />
              AI Entries
            </h3>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">Haliye Entries</p>
          </div>
        </div>
        <div className="space-y-5 relative z-10">
          {stats.recentActivity.length === 0 ? (
            <div className="p-24 text-center bg-white/5 rounded-[48px] border-2 border-dashed border-white/5">
              <p className="text-slate-500 font-bold italic text-lg uppercase tracking-widest opacity-60">Abhi tak koi entry nahi hui.</p>
            </div>
          ) : (
            stats.recentActivity.map((item) => (
              <div key={item.id} className="group flex items-center justify-between p-8 bg-white/5 hover:bg-white/10 rounded-[40px] border border-white/5 transition-all">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl ${item.type === 'SALE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {item.type === 'SALE' ? <ShoppingCart size={24} /> : <Package size={24} />}
                  </div>
                  <div>
                    <p className="font-black text-white text-xl leading-tight">{item.text}</p>
                    <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} /> {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-black ${item.type === 'SALE' ? 'text-emerald-400' : 'text-blue-400'}`}>{item.amount}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

const VoiceCommandCard = ({ command, label }: { command: string, label: string }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all group backdrop-blur-xl">
    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">{label}</p>
    <p className="text-white font-bold text-base leading-tight italic group-hover:text-indigo-300 transition-colors">"{command}"</p>
  </div>
);

const StatCard = ({ label, value, trend, color, icon, onClick }: any) => {
  const themes: any = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/5',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5'
  };
  return (
    <div onClick={onClick} className={`bg-slate-900 p-10 rounded-[48px] border border-white/5 shadow-2xl transition-all group relative overflow-hidden ${onClick ? 'cursor-pointer hover:border-white/10' : ''}`}>
      <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mb-10 border transition-transform group-hover:scale-110 ${themes[color]}`}>{icon}</div>
      <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{label}</p>
      <h4 className="text-4xl font-black text-white tracking-tighter mb-4">{value}</h4>
      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{trend}</p>
    </div>
  );
};

export default BusinessInsights;
