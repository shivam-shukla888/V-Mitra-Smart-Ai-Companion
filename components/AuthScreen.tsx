
import React, { useState } from 'react';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Loader2, KeyRound } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (userData: { email: string, name: string }) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        setTimeout(() => {
          if (email && password) {
            onLogin({ email, name: email.split('@')[0] });
          } else {
            setError("Galat email ya password.");
          }
          setIsLoading(false);
        }, 1500);
      } else if (mode === 'register') {
        setTimeout(() => {
          setMode('otp');
          setIsLoading(false);
        }, 1200);
      } else if (mode === 'otp') {
        setTimeout(() => {
          if (otp === '123456') {
            onLogin({ email, name: name || email.split('@')[0] });
          } else {
            setError("Galat OTP. Try 123456");
          }
          setIsLoading(false);
        }, 1200);
      }
    } catch (err) {
      setError("Server connection nahi ho raha.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-[#020617] flex items-center justify-center p-6">
      <div className="w-full max-w-xl animate-in fade-in duration-700">
        <div className="text-center mb-16">
          <div className="inline-flex w-20 h-20 bg-indigo-600 rounded-[28px] items-center justify-center text-white shadow-2xl mb-8">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-7xl font-black text-white tracking-tighter mb-4 leading-none">V-Mitra</h1>
          <p className="text-indigo-400 font-black uppercase tracking-[0.4em] text-xs">Aapka Business Brain</p>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl p-10 md:p-14 rounded-[56px] border border-white/5 shadow-3xl">
          <div className="flex gap-8 mb-12 border-b border-white/5 pb-6">
            <button onClick={() => { setMode('login'); setError(null); }} className={`text-xl font-black transition-all ${mode === 'login' ? 'text-white' : 'text-slate-600'}`}>LOGIN</button>
            <button onClick={() => { setMode('register'); setError(null); }} className={`text-xl font-black transition-all ${mode !== 'login' ? 'text-white' : 'text-slate-600'}`}>SIGN UP</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black uppercase rounded-2xl">{error}</div>}

            {mode === 'otp' ? (
              <div className="space-y-6">
                <p className="text-slate-400 text-sm font-medium">OTP humne <span className="text-indigo-400">{email}</span> pe bhej diya hai.</p>
                <div className="relative">
                  <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input type="text" placeholder="ENTER 6-DIGIT OTP" maxLength={6} className="w-full pl-16 pr-6 py-5 bg-slate-950/50 border border-white/10 rounded-3xl text-white font-black text-lg tracking-[0.5em]" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                </div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input type="email" placeholder="EMAIL ADDRESS" className="w-full pl-16 pr-6 py-5 bg-slate-950/50 border border-white/10 rounded-3xl text-white font-bold" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                {mode === 'register' && (
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input type="text" placeholder="APNA NAAM" className="w-full pl-16 pr-6 py-5 bg-slate-950/50 border border-white/10 rounded-3xl text-white font-bold" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                )}
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input type="password" placeholder="PASSWORD" className="w-full pl-16 pr-6 py-5 bg-slate-950/50 border border-white/10 rounded-3xl text-white font-bold" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </>
            )}

            <button disabled={isLoading} className="w-full py-6 bg-white text-slate-900 rounded-[28px] font-black text-lg tracking-widest flex items-center justify-center gap-4 hover:bg-slate-100 transition-all active:scale-95 shadow-2xl disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" /> : mode === 'otp' ? 'SHURU KAREIN' : mode === 'login' ? 'LOGIN' : 'OTP BHEJEIN'}
              {!isLoading && <ArrowRight size={20} />}
            </button>
          </form>

          <p className="mt-10 text-center text-slate-600 text-xs font-black uppercase tracking-widest">
            {mode === 'login' ? "Naya account chahiye? Sign Up karein" : "Account hai? Login karein"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
