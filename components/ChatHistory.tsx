
import React, { useState } from 'react';
import { MessageSquare, Calendar, ChevronRight, Play, Trash2, X, Clock, User, Bot } from 'lucide-react';
import { ChatSession } from '../types';

interface ChatHistoryProps {
  history: ChatSession[];
  onDelete: (id: string) => void;
  onClear: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ history, onDelete, onClear }) => {
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Kya aap ye voice log delete karna chahte hain?")) {
      onDelete(id);
    }
  };

  const handleClear = () => {
    if (window.confirm("Saari history saaf kar dein?")) {
      onClear();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-black text-white">Voice Conversation History</h3>
        {history.length > 0 && (
          <button onClick={handleClear} className="text-xs font-black text-rose-500 uppercase px-4 py-2 bg-rose-500/10 rounded-xl border border-rose-500/20">Clear All</button>
        )}
      </div>

      <div className="grid gap-4">
        {history.length === 0 ? (
          <div className="py-24 text-center bg-slate-900 rounded-[40px] border-2 border-dashed border-white/5">
            <h3 className="text-xl font-black text-slate-500 mb-2 uppercase tracking-widest">Koi History Nahi Hai</h3>
          </div>
        ) : (
          history.map((session) => (
            <div key={session.id} onClick={() => setActiveSession(session)} className="group bg-slate-900 p-6 rounded-[32px] border border-white/5 shadow-sm hover:shadow-2xl hover:border-indigo-500/30 transition-all cursor-pointer flex items-center gap-6">
              <div className="w-14 h-14 bg-white/5 text-indigo-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                <MessageSquare size={24} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">
                  <Calendar size={12} />
                  {session.date.toLocaleDateString()} at {session.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <h4 className="text-white font-black text-lg leading-tight mb-1 truncate">{session.summary}</h4>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => handleDelete(e, session.id)} className="p-3 text-slate-600 hover:text-rose-500 rounded-xl">
                  <Trash2 size={18} />
                </button>
                <ChevronRight className="text-slate-700" size={20} />
              </div>
            </div>
          ))
        )}
      </div>

      {activeSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setActiveSession(null)}></div>
          <div className="relative w-full max-w-2xl bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[80vh] border border-white/10">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div>
                <h3 className="text-2xl font-black text-white">Baatchit Recap</h3>
                <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">{activeSession.date.toLocaleDateString()}</p>
              </div>
              <button onClick={() => setActiveSession(null)} className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {activeSession.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-[28px] ${msg.type === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/10'}`}>
                    <p className="text-base font-medium leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-slate-900 border-t border-white/5 flex justify-end">
              <button onClick={() => setActiveSession(null)} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;
