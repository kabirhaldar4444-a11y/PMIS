import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertProvider';
import PMISLogo from '../components/common/PMISLogo';

const MasterRecovery = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const AUTHORIZED_MASTERS = [
    'admin@pmi.com',
    'contact@pmiusservices.com',
    'karthikriyan7@gmail.com'
  ];

  const handleRecovery = async (e) => {
    e.preventDefault();
    if (!AUTHORIZED_MASTERS.includes(email.toLowerCase().trim())) {
      showAlert('Unauthorized: Restricted Access.', 'error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail('karthikriyan7@gmail.com', {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      showAlert(error.message || 'Recovery failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden font-outfit">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bubble w-40 h-40 top-[15%] left-[5%]" style={{ animation: 'bubble-drift-right 50s infinite linear' }}>
          <div className="bubble-glow bg-blue-400/10" />
        </div>
        <div className="bubble w-48 h-48 top-[40%] right-[10%]" style={{ animation: 'bubble-drift-left 55s infinite linear', animationDelay: '-12s' }}>
          <div className="bubble-glow bg-emerald-400/10" />
        </div>
      </div>

      <div className="relative z-10 w-full px-6 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-[-35px] transform-gpu scale-90 sm:scale-100"
        >
           <PMISLogo variant="login" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-[320px] mx-auto text-center"
        >
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-8">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-800 mb-2">Master Recovery</h2>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">Identity Verification</p>
                </div>

                <form onSubmit={handleRecovery} className="space-y-8">
                  <div className="space-y-0 text-left">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-0 leading-none">
                      Authorized Email
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 group-focus-within:text-slate-900 transition-colors" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-7 pr-4 py-3 bg-transparent border-b border-slate-100 text-slate-800 text-base placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-all font-medium"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize & Send Link'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6"
              >
                <div className="flex justify-center mb-8">
                  <CheckCircle2 className="w-12 h-12 text-slate-900" />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-800 mb-4">Link Dispatched</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em] mb-12">
                  Check your master inbox for access.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 text-slate-400 hover:text-slate-900 transition-all text-[9px] font-black uppercase tracking-[0.3em]"
                >
                  Return to Portal
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="mt-16 flex flex-col items-center">
            {!success && (
              <button 
                onClick={() => navigate('/login')}
                className="group flex items-center gap-2 text-slate-300 hover:text-slate-900 transition-colors mb-8"
              >
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Back to Portal</span>
              </button>
            )}
            <p className="text-slate-200 text-[8px] font-black uppercase tracking-[0.8em] opacity-50">
              PMI Ecosystem
            </p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
};

export default MasterRecovery;
