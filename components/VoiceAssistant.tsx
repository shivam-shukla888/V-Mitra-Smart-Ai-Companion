
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Mic, MicOff, Volume2, X, Loader2, CheckCircle2, AlertCircle, Key, AlertTriangle } from 'lucide-react';
import { createBlob, decode, decodeAudioData } from '../audioUtils';
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

const recordSaleTool: FunctionDeclaration = {
  name: 'record_sale',
  parameters: {
    type: Type.OBJECT,
    description: 'Record a business sale. Use this when the user mentions selling items.',
    properties: {
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            quantity: { type: Type.NUMBER }
          },
          required: ['name', 'quantity']
        }
      }
    },
    required: ['items']
  }
};

const restockTool: FunctionDeclaration = {
  name: 'update_inventory_stock',
  parameters: {
    type: Type.OBJECT,
    description: 'Update stock levels for restocking or new arrivals.',
    properties: {
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            quantity: { type: Type.NUMBER }
          },
          required: ['name', 'quantity']
        }
      }
    },
    required: ['items']
  }
};

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onClose, currentLocation, locationCoords, onRecordSale, onRestock, onSaveSession, onQuotaError }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');

  const onSaveSessionRef = useRef(onSaveSession);
  const transcriptionsRef = useRef(transcriptions);

  useEffect(() => {
    onSaveSessionRef.current = onSaveSession;
  }, [onSaveSession]);

  useEffect(() => {
    transcriptionsRef.current = transcriptions;
  }, [transcriptions]);

  const stopSession = useCallback(() => {
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
    if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
    sourcesRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
    sourcesRef.current.clear();
    
    if (transcriptionsRef.current.length > 0) {
      onSaveSessionRef.current({
        id: 'S' + Date.now(),
        date: new Date(),
        summary: transcriptionsRef.current[0].text.slice(0, 50),
        messages: [...transcriptionsRef.current]
      });
    }

    setIsActive(false);
    setIsConnecting(false);
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    setIsQuotaExceeded(false);
    try {
      // @google/genai initialization fix: strictly use process.env.API_KEY per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inCtx;
      outAudioContextRef.current = outCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const systemInstruction = `${getSystemInstruction(Language.HINGLISH)}\nLocation: ${currentLocation || 'Unknown'}. Use Hindi/Hinglish always.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              // CRITICAL: Solely rely on sessionPromise resolves to send data to prevent race conditions or stale references.
              sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle model interruption: stop all current audio playback immediately
            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current.values()) {
                try { source.stop(); } catch (e) {}
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'record_sale') {
                  const result = await onRecordSale((fc.args as any).items);
                  if (result.success) {
                    setSuccessMsg(`Bill Save ho gaya: ₹${result.amount ?? 0}`);
                    setTimeout(() => setSuccessMsg(null), 3500);
                  }
                } else if (fc.name === 'update_inventory_stock') {
                  const result = await onRestock((fc.args as any).items);
                  if (result.success) {
                    setSuccessMsg("Stock update ho gaya!");
                    setTimeout(() => setSuccessMsg(null), 3500);
                  }
                }
                sessionPromise.then((session) => {
                  session.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "Theek hai" } },
                  });
                });
              }
            }

            if (message.serverContent?.outputTranscription) {
              currentOutputTransRef.current += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTransRef.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const uText = currentInputTransRef.current.trim();
              const aText = currentOutputTransRef.current.trim();
              if (uText) setTranscriptions(prev => [...prev, { id: Date.now().toString(), type: 'user', text: uText, timestamp: new Date() }]);
              if (aText) setTranscriptions(prev => [...prev, { id: (Date.now()+1).toString(), type: 'ai', text: aText, timestamp: new Date() }]);
              currentInputTransRef.current = '';
              currentOutputTransRef.current = '';
              setIsAiThinking(false);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsAiThinking(true);
              const outCtx = outAudioContextRef.current!;
              // Schedule playback for gapless audio stream
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              // Ensure sources are cleared from memory once finished
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (err: any) => { 
            const msg = err?.message || "";
            // Handle project/API key verification issues by triggering re-selection
            if (msg.includes("Requested entity was not found.")) {
              onQuotaError?.();
              return;
            }
            if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
              setIsQuotaExceeded(true);
              setError("AI Busy: Bahut log use kar rahe hain.");
            } else {
              setError("Connection Error"); 
            }
            stopSession(); 
          },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstruction,
          // Gemini Live API tools: using function declarations for business logic
          tools: [
            { functionDeclarations: [recordSaleTool, restockTool] }
          ],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err: any) {
      setIsConnecting(false);
      const msg = err?.message || "";
      if (msg.includes("Requested entity was not found.")) {
        onQuotaError?.();
        return;
      }
      if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
        setIsQuotaExceeded(true);
        setError("AI Busy. Apni Key lagayein.");
      } else {
        setError("Mic Permission chahiye.");
      }
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
            <h2 className="text-white font-black text-2xl tracking-tighter">V-Mitra Voice OS</h2>
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
          <p className="text-white font-black uppercase tracking-[0.4em] text-xs mb-2">{isActive ? 'VOICE ENTRY CHALU HAI' : 'Baatchit Shuru Karein'}</p>
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
