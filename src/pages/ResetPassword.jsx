import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertProvider';
import PMISLogo from '../components/common/PMISLogo';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showAlert('Invalid or expired reset session.', 'error');
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    checkSession();
  }, [navigate, showAlert]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showAlert('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 6) {
      showAlert('Minimum 6 characters required.', 'error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      showAlert(error.message || 'Reset failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden font-outfit">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bubble w-40 h-40 top-[10%] right-[10%]" style={{ animation: 'bubble-drift-left 50s infinite linear' }}>
          <div className="bubble-glow bg-blue-400/10" />
        </div>
        <div className="bubble w-48 h-48 top-[30%] left-[5%]" style={{ animation: 'bubble-drift-right 55s infinite linear', animationDelay: '-8s' }}>
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
                  <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-800 mb-2">Secure Reset</h2>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">Credentials Update</p>
                </div>

                <form onSubmit={handleReset} className="space-y-6">
                  <div className="space-y-0 text-left">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-0 leading-none">
                      New Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 group-focus-within:text-slate-900 transition-colors" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-7 pr-12 py-3 bg-transparent border-b border-slate-100 text-slate-800 text-base placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-all font-medium"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-200 hover:text-slate-900 transition-all"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-0 text-left">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-0 leading-none">
                      Confirm Reset
                    </label>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 group-focus-within:text-slate-900 transition-colors" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-7 pr-4 py-3 bg-transparent border-b border-slate-100 text-slate-800 text-base placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-all font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Access Portal'}
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
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-800 mb-4">Reset Successful</h2>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mb-12">
                  Returning to secure portal.
                </p>
                <div className="flex items-center justify-center gap-2 text-slate-300">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-[8px] font-black uppercase tracking-[0.3em]">Redirecting...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="mt-20 flex flex-col items-center opacity-40">
            <p className="text-slate-300 text-[8px] font-black uppercase tracking-[1em]">
              PMI Secure Layer
            </p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
