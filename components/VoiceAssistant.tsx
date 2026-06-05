import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, X, Loader2, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { getSystemInstruction } from '../constants';
import { TranscriptionItem, Language, ChatSession } from '../types';

interface VoiceAssistantProps {
  onClose: () => void;
  currentLocation?: string;
  locationCoords?: { lat: number, lng: number } | null;
  onRecordSale: (items: { name: string, quantity: number }[]) => Promise<{ success: boolean, amount?: number, message?: string }>;
  onRestock: (items: { name: string, quantity: number }[]) => Promise<{ success: boolean, message: string }>;
  onSaveSession: (session: ChatSession) => void;
  onQuotaError?: () => void;
}

const tools = [
  {
    type: "function",
    function: {
      name: "record_sale",
      description: "Record a business sale. Use this when the user mentions selling items.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "number" }
              },
              required: ["name", "quantity"]
            }
          }
        },
        required: ["items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_inventory_stock",
      description: "Update stock levels for restocking or new arrivals.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "number" }
              },
              required: ["name", "quantity"]
            }
          }
        },
        required: ["items"]
      }
    }
  }
];

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onClose, currentLocation, locationCoords, onRecordSale, onRestock, onSaveSession, onQuotaError }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  const onSaveSessionRef = useRef(onSaveSession);
  const transcriptionsRef = useRef(transcriptions);

  useEffect(() => {
    onSaveSessionRef.current = onSaveSession;
  }, [onSaveSession]);

  useEffect(() => {
    transcriptionsRef.current = transcriptions;
  }, [transcriptions]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getApiKey = () => {
    return localStorage.getItem('groq_api_key') || process.env.GROQ_API_KEY || '';
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      // Try to find an Indian English or Hindi voice for more natural Hinglish accent
      const hiVoice = voices.find(v => v.lang.startsWith('hi') || v.lang.includes('IN') || v.lang.includes('in'));
      if (hiVoice) {
        utterance.voice = hiVoice;
      }
      utterance.lang = 'hi-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSession = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);

    if (transcriptionsRef.current.length > 0) {
      onSaveSessionRef.current({
        id: 'S' + Date.now(),
        date: new Date(),
        summary: transcriptionsRef.current[0].text.slice(0, 50),
        messages: [...transcriptionsRef.current]
      });
    }
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    setIsQuotaExceeded(false);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processAudioAndRespond();
      };

      mediaRecorder.start();
      setIsActive(true);
      setIsConnecting(false);
    } catch (err: any) {
      setIsConnecting(false);
      setError("Mic Permission chahiye.");
      console.error("Microphone access error:", err);
    }
  };

  const processAudioAndRespond = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsAiThinking(true);
    setError(null);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      // Create a file from blob
      const audioFile = new File([audioBlob], 'speech.webm', { type: 'audio/webm' });

      const apiKey = getApiKey();
      
      // Step 1: Speech-to-Text via Groq Whisper API
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'hi'); // Hinglish prompts work best with 'hi' fallback or autodetect
      formData.append('prompt', 'V-Mitra general store business billing. attaa, doodh, chini, tel, chawal, sabun.');

      const transResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!transResponse.ok) {
        const errJson = await transResponse.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Whisper API error (${transResponse.status})`);
      }

      const transData = await transResponse.json();
      const userText = transData.text?.trim();

      if (!userText) {
        setIsAiThinking(false);
        return; // nothing was said
      }

      // Add user transcript to UI
      setTranscriptions(prev => [...prev, { id: Date.now().toString(), type: 'user', text: userText, timestamp: new Date() }]);

      // Step 2: Chat Completion with Tool Calling via Groq Llama-3.3-70b-versatile
      const systemInstruction = `${getSystemInstruction(Language.HINGLISH)}\nLocation: ${currentLocation || 'Unknown'}. Use Hindi/Hinglish always.`;
      
      // Format context messages
      const apiMessages: any[] = [
        { role: 'system', content: systemInstruction },
        ...transcriptionsRef.current.map(t => ({
          role: t.type === 'user' ? 'user' : 'assistant',
          content: t.text
        })),
        { role: 'user', content: userText }
      ];

      const chatResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: apiMessages,
          tools: tools,
          tool_choice: 'auto',
          temperature: 0.6
        })
      });

      if (!chatResponse.ok) {
        const errJson = await chatResponse.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Chat Completions error (${chatResponse.status})`);
      }

      const chatData = await chatResponse.json();
      const choiceMessage = chatData?.choices?.[0]?.message;

      if (!choiceMessage) {
        throw new Error("No response message from Groq Llama model");
      }

      // Check for tool calling
      if (choiceMessage.tool_calls && choiceMessage.tool_calls.length > 0) {
        // Append assistant message containing tool calls
        apiMessages.push(choiceMessage);

        for (const tc of choiceMessage.tool_calls) {
          const fnName = tc.function.name;
          const fnArgs = JSON.parse(tc.function.arguments);
          let toolResultText = "";

          if (fnName === 'record_sale') {
            const result = await onRecordSale(fnArgs.items);
            if (result.success) {
              setSuccessMsg(`Bill Save: ₹${result.amount ?? 0}`);
              setTimeout(() => setSuccessMsg(null), 3500);
              toolResultText = `Successfully recorded sale. Total: ₹${result.amount}`;
            } else {
              toolResultText = `Failed to record sale: ${result.message || 'Product not matched or out of stock'}`;
            }
          } else if (fnName === 'update_inventory_stock') {
            const result = await onRestock(fnArgs.items);
            if (result.success) {
              setSuccessMsg("Stock update ho gaya!");
              setTimeout(() => setSuccessMsg(null), 3500);
              toolResultText = "Successfully restocked inventory items.";
            } else {
              toolResultText = `Failed to update inventory stock: ${result.message}`;
            }
          }

          apiMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: fnName,
            content: JSON.stringify({ result: toolResultText })
          });
        }

        // Send tool results back to Groq to generate a human response
        const finalChatResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: apiMessages
          })
        });

        if (!finalChatResponse.ok) {
          const errJson = await finalChatResponse.json().catch(() => ({}));
          throw new Error(errJson?.error?.message || `Final Chat completions error (${finalChatResponse.status})`);
        }

        const finalChatData = await finalChatResponse.json();
        const finalMessage = finalChatData?.choices?.[0]?.message?.content || "Hisaab update ho gaya hai.";
        
        setTranscriptions(prev => [...prev, { id: (Date.now() + 1).toString(), type: 'ai', text: finalMessage, timestamp: new Date() }]);
        speakText(finalMessage);
      } else {
        // Standard chat response without tool calls
        const finalMessage = choiceMessage.content || "Kripya fir se bolein.";
        setTranscriptions(prev => [...prev, { id: (Date.now() + 1).toString(), type: 'ai', text: finalMessage, timestamp: new Date() }]);
        speakText(finalMessage);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "";
      if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("invalid_api_key")) {
        onQuotaError?.();
      } else if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit")) {
        setIsQuotaExceeded(true);
        setError("AI Busy. Apni Key check karein.");
      } else {
        setError("AI error: Koshish karein dobara.");
      }
    } finally {
      setIsAiThinking(false);
    }
  };

  useEffect(() => { 
    return () => {
      stopSession(); 
    };
  }, [stopSession]);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/98 backdrop-blur-3xl flex flex-col animate-in fade-in duration-500 overflow-hidden">
      <div className="px-8 py-6 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center text-white"><Volume2 size={28} /></div>
          <div>
            <h2 className="text-white font-black text-2xl tracking-tighter">V-Mitra Voice OS (Groq)</h2>
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">{isActive ? 'AI Sun Raha Hai' : 'Standby'}</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-4 bg-white/5 text-slate-400 hover:text-white rounded-[24px]"><X size={28} /></button>
      </div>

      {isQuotaExceeded && (
        <div className="mx-8 mt-6 p-8 bg-amber-600 text-white rounded-[40px] flex items-center justify-between gap-4 border-2 border-amber-400/30">
          <div className="flex items-center gap-4">
            <AlertTriangle size={32} />
            <div>
              <p className="font-black text-xl uppercase leading-none">AI Busy (Quota Full)</p>
              <p className="text-sm font-bold opacity-80 mt-1">Apni Pro API Key laga kar unlimited access payein.</p>
            </div>
          </div>
          <button onClick={onQuotaError} className="bg-white text-amber-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">Switch Key</button>
        </div>
      )}

      {successMsg && (
        <div className="mx-8 mt-6 p-6 bg-emerald-500 text-white rounded-[32px] flex items-center gap-4 animate-bounce">
          <CheckCircle2 size={28} />
          <span className="font-black text-lg uppercase tracking-widest">{successMsg}</span>
        </div>
      )}

      {error && !isQuotaExceeded && (
        <div className="mx-8 mt-6 p-6 bg-rose-500 text-white rounded-[32px] flex items-center gap-4">
          <AlertCircle size={28} />
          <span className="font-black text-lg uppercase tracking-widest">{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8 md:p-20 space-y-10">
        {transcriptions.length === 0 && !isActive && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-40 h-40 bg-indigo-500/10 rounded-[64px] flex items-center justify-center mb-10 border border-indigo-500/20">
              <Mic size={56} className="text-indigo-400" />
            </div>
            <h3 className="text-white text-4xl font-black mb-6 tracking-tighter max-w-lg mx-auto">"2 packet milk aur 1 kilo cheeni bechi"</h3>
            <p className="text-slate-500 text-xl max-w-lg mx-auto font-medium leading-relaxed italic">Apni bhasha mein bolein. V-Mitra sab record kar lega.</p>
          </div>
        )}
        
        {isActive && !isAiThinking && transcriptions.length === 0 && (
          <div className="flex items-center justify-center gap-2 h-32">
             {[...Array(8)].map((_, i) => (
               <div key={i} className="w-1.5 bg-indigo-500 rounded-full animate-sound-bar" style={{ height: '20px', animationDelay: `${i * 0.1}s` }}></div>
             ))}
          </div>
        )}

        {transcriptions.map((item) => (
          <div key={item.id} className={`flex flex-col ${item.type === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-4`}>
            <div className={`max-w-[85%] p-8 rounded-[44px] ${item.type === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 rounded-tl-none'}`}>
              <p className="text-xl font-bold leading-relaxed">{item.text}</p>
            </div>
          </div>
        ))}
        
        {isAiThinking && (
          <div className="flex items-center gap-3 p-6 bg-white/5 rounded-full w-fit">
            <Loader2 className="animate-spin text-indigo-400" size={20} />
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">AI Soch raha hai...</span>
          </div>
        )}
      </div>

      <div className="p-16 flex flex-col items-center gap-8 border-t border-white/5 bg-slate-900/30 backdrop-blur-md">
        <button
          onClick={isActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`w-32 h-32 rounded-[48px] flex items-center justify-center transition-all ${isActive ? 'bg-rose-600 text-white scale-110 shadow-3xl' : 'gradient-bg text-white hover:scale-105 active:scale-90'}`}
        >
          {isConnecting ? <Loader2 className="animate-spin" size={40} /> : isActive ? <MicOff size={44} /> : <Mic size={44} />}
        </button>
        <div className="text-center">
          <p className="text-white font-black uppercase tracking-[0.4em] text-xs mb-2">{isActive ? 'VOICE ENTRY CHALU (TAP TO PROCESS)' : 'Baatchit Shuru Karein'}</p>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">V-Mitra Bharat ki Awaz</p>
        </div>
      </div>

      <style>{`
        @keyframes sound-bar { 0%, 100% { height: 20px; } 50% { height: 80px; } }
        .animate-sound-bar { animation: sound-bar 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default VoiceAssistant;
