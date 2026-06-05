
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Store, Mic, ShieldCheck, Briefcase, History, Receipt, Zap, CheckCircle2, MapPin, LayoutDashboard, FileText, LogOut, Key, Sparkles, Mail, Server, ShieldAlert, RefreshCw, Award, User, ShoppingCart, TrendingUp, Package, AlertCircle, Clock, Plus, Calculator, BarChart as BarChartIcon, AlertTriangle, Shield, X
} from 'lucide-react';
import { useDataManager } from './useDataManager';
import AuthScreen from './components/AuthScreen';
import VoiceAssistant from './components/VoiceAssistant';
import BusinessInsights from './components/BusinessInsights';
import Inventory from './components/Inventory';
import ChatHistory from './components/ChatHistory';
import SaleHistory from './components/SaleHistory';
import ManualSaleModal from './components/ManualSaleModal';

/**
 * V-Mitra - Market Ready AI Business OS
 */
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{ email: string, name: string } | null>(null);
  const [activeTab, setActiveTab] = useState('insights');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isManualSaleOpen, setIsManualSaleOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);

  const { 
    sales, inventory, history, recordSale, restockItem, deleteSale, 
    addChatSession, deleteChatSession, clearChatHistory, getStats 
  } = useDataManager();
  
  const liveStats = getStats();

  useEffect(() => {
    const savedUser = localStorage.getItem('vmitra_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleLogin = (userData: { email: string, name: string }) => {
    setCurrentUser(userData);
    localStorage.setItem('vmitra_user', JSON.stringify(userData));
    showToast(`Namaste, ${userData.name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('vmitra_user');
    showToast("Logout ho gaya.");
  };

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [groqKeyInput, setGroqKeyInput] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('groq_api_key') || '';
    setGroqKeyInput(savedKey);
  }, [isKeyModalOpen]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (groqKeyInput.trim()) {
      localStorage.setItem('groq_api_key', groqKeyInput.trim());
      showToast("Groq API Key save ho gayi!", "success");
    } else {
      localStorage.removeItem('groq_api_key');
      showToast("Default Key use ho rahi hai.", "info");
    }
    setIsKeyModalOpen(false);
    // Refresh page to re-initialize services with new key
    setTimeout(() => window.location.reload(), 500);
  };

  const handleOpenKeySelector = () => {
    setIsKeyModalOpen(true);
  };

  if (!currentUser) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col md:flex-row max-w-[1600px] mx-auto overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      {/* Sidebar - Pro Navigation */}
      <aside className="hidden md:flex w-72 bg-[#020617] border-r border-white/5 flex-col p-10 shrink-0">
        <div className="flex items-center gap-4 mb-16">
          <div className="w-12 h-12 bg-indigo-600 rounded-[18px] flex items-center justify-center text-white shadow-lg"><Store size={26} /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white leading-none">V-Mitra</h1>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1">PRO BUSINESS ENGINE</p>
          </div>
        </div>
        <nav className="flex-1 space-y-6">
          <SidebarLink icon={<LayoutDashboard size={20} />} label="Hisaab Kitab" active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} />
          <SidebarLink icon={<FileText size={20} />} label="Rozana Bikri" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
          <SidebarLink icon={<Briefcase size={20} />} label="Stock List" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
          <SidebarLink icon={<History size={20} />} label="Voice Logs" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <div className="pt-8 border-t border-white/5">
            <SidebarLink icon={<ShieldCheck size={20} />} label="Owner Section" active={activeTab === 'founder'} onClick={() => setActiveTab('founder')} highlight />
          </div>
        </nav>
        <button onClick={handleLogout} className="mt-20 w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full font-black text-sm text-slate-500 hover:text-rose-500 transition-all"><LogOut size={18} /><span>Log Out</span></button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#020617] p-8 md:p-16">
        {activeTab === 'insights' && (
          <BusinessInsights 
            stats={liveStats} sales={sales} inventory={inventory} 
            onQuickSale={recordSale} onOpenManualSale={() => setIsManualSaleOpen(true)} onQuotaError={handleOpenKeySelector} 
          />
        )}
        {activeTab === 'sales' && <SaleHistory sales={sales} onDeleteSale={deleteSale} />}
        {activeTab === 'inventory' && <Inventory inventory={inventory} />}
        {activeTab === 'history' && <ChatHistory history={history} onDelete={deleteChatSession} onClear={clearChatHistory} />}
        {activeTab === 'founder' && <FounderArea onSelectKey={handleOpenKeySelector} />}
      </main>

      {/* Global Voice Button - Cleaned up */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[340px] px-4">
        <button onClick={() => setIsVoiceActive(true)} className="w-full bg-white text-slate-900 rounded-[32px] p-6 flex items-center justify-between shadow-2xl hover:scale-[1.03] transition-all group">
          <div className="flex items-center gap-5">
            <div className="bg-[#020617] text-white p-4 rounded-2xl"><Mic size={26} /></div>
            <div className="flex flex-col items-start text-left">
              <span className="font-black text-2xl tracking-tighter uppercase leading-[0.9]">V-Mitra</span>
              <span className="text-[10px] text-indigo-600 font-black uppercase mt-1 tracking-widest">AI Enabled AI Powered</span>
            </div>
          </div>
          <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></span>
        </button>
      </div>

      {/* Modals */}
      {isVoiceActive && <VoiceAssistant onClose={() => setIsVoiceActive(false)} onRecordSale={recordSale} onRestock={restockItem} onSaveSession={addChatSession} onQuotaError={handleOpenKeySelector} />}
      {isManualSaleOpen && <ManualSaleModal inventory={inventory} onClose={() => setIsManualSaleOpen(false)} onSubmit={recordSale} />}
      {toast && (
        <div className="fixed top-8 right-8 z-[200] bg-white text-slate-900 px-6 py-4 rounded-2xl shadow-2xl border border-indigo-100 flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle2 className="text-emerald-500" size={20} />
          <span className="font-bold">{toast.message}</span>
        </div>
      )}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-[#0b1329] border border-white/10 w-full max-w-lg rounded-[36px] p-8 shadow-3xl relative overflow-hidden">
            <button onClick={() => setIsKeyModalOpen(false)} className="absolute top-6 right-6 p-2 bg-white/5 text-slate-400 hover:text-white rounded-full transition-all">
              <X size={18} />
            </button>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
              <Key size={22} />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">Groq Pro API Key</h3>
            <p className="text-slate-400 text-sm mb-6">Apni Groq API Key yahan enter karein. Default key automatic load ho jayegi agar blank chhodenge.</p>
            <form onSubmit={handleSaveKey} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-indigo-400 uppercase tracking-widest">API Key</label>
                <input 
                  type="password" 
                  value={groqKeyInput} 
                  onChange={(e) => setGroqKeyInput(e.target.value)} 
                  placeholder="gsk_..." 
                  className="w-full bg-slate-900/80 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition-all text-sm"
                />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => { localStorage.removeItem('groq_api_key'); setGroqKeyInput(''); showToast("Default key restore ho gayi.", "info"); setIsKeyModalOpen(false); setTimeout(() => window.location.reload(), 500); }} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                  Reset Default
                </button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20">
                  Save Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarLink = ({ icon, label, active, onClick, highlight }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-indigo-600 text-white shadow-xl' : highlight ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
    {icon}<span>{label}</span>
  </button>
);

const FounderArea = ({ onSelectKey }: any) => (
  <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto py-20">
    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl"><Shield size={40} /></div>
    <h2 className="text-6xl font-black text-white tracking-tighter mb-6 leading-none">Built for Scale</h2>
    <p className="text-2xl text-slate-400 font-medium mb-12 italic">"Bharat ke dukandaaro ke liye banaya gaya Bharat ka pehla Smart AI Business OS."</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
      <div className="bg-white/5 p-12 rounded-[56px] border border-white/5 text-left">
        <h3 className="text-2xl font-black text-white mb-4">Shivam Shukla</h3>
        <p className="text-slate-400 mb-8">Visionary founder dedicated to empowering local merchants with enterprise-grade data security and AI automation.</p>
        <div className="flex gap-4">
          <a href="#" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-center font-bold">LinkedIn</a>
          <a href="#" className="flex-1 py-4 bg-white/10 text-white rounded-2xl text-center font-bold">Profile</a>
        </div>
      </div>
      <div className="bg-white/5 p-12 rounded-[56px] border border-indigo-500/20 text-left">
        <h3 className="text-2xl font-black text-white mb-4">Data Security</h3>
        <p className="text-slate-400 mb-8">Bank-grade encryption aur transaction safety ke saath aapka bahi-khata humesha secure rehta hai.</p>
        <button onClick={onSelectKey} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"><Key size={18} /> Switch Pro Key</button>
      </div>
    </div>
  </div>
);

export default App;
