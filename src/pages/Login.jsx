import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertProvider';

import PMISLogo from '../components/common/PMISLogo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(email, password);
      
      // Fetch profile for role-based redirection
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, profile_completed')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      showAlert('Verification successful. Welcome back!', 'success');
      
      // Multi-Role Redirection Logic
      setTimeout(() => {
        if (profile.role === 'admin') {
          navigate('/admin');
        } else if (profile.role === 'super_admin') {
          navigate('/super-admin');
        } else {
          navigate(profile.profile_completed ? '/' : '/complete-profile');
        }
      }, 800);

    } catch (error) {
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        showAlert('Email not confirmed! Please check your inbox.', 'warning');
      } else {
        showAlert(error.message || 'Login failed. Please check credentials.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-6 relative bg-slate-50/50">
      {/* Dynamic Background Blobs */}
      <div className="blob w-[30rem] h-[30rem] bg-blue-400/10 -top-20 -left-20" />
      <div className="blob w-[25rem] h-[25rem] bg-indigo-400/10 -bottom-20 -right-20" style={{ animationDelay: '-5s' }} />
      <div className="blob w-[20rem] h-[20rem] bg-purple-400/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '-10s' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card-saas w-full max-w-lg p-10 md:p-14 relative z-10 overflow-hidden"
      >
        <div className="mb-4 pt-0 w-full transform hover:scale-[1.02] transition-transform duration-500">
          <PMISLogo variant="login" />
        </div>

        <form onSubmit={handleLogin} className="space-y-7 relative z-10">
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
              Authorized Email
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 group-focus-within:text-blue-500 text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input 
                type="email" 
                required
                className="input-premium w-full !pl-16 !py-5" 
                placeholder="name@pmi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
              Security Key
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 group-focus-within:text-blue-500 text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                type="password" 
                required
                className="input-premium w-full !pl-16 !py-5" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-premium w-full !py-5 !text-lg !rounded-2xl shadow-2xl mt-4 group overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  Enter Portal 
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>
        </form>

        <footer className="mt-14 pt-8 border-t border-slate-100/50 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.25em]">
              Production Node-01 • Secure
            </p>
          </div>
          <p className="text-[9px] text-slate-300 font-medium">
            Proprietary Access Controlled Environment
          </p>
        </footer>
      </motion.div>
    </div>
  );
};

export default Login;

