import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, Smartphone, Laptop, Watch, Headphones } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertProvider';

import PMISLogo from '../components/common/PMISLogo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-slate-50 overflow-hidden">
      {/* Dynamic Background Elements - Reward Showcase with Light Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Bubbles with Reward Text */}
        <div className="bubble w-28 h-28 top-[15%]" style={{ animation: 'bubble-drift-right 14s infinite linear' }}>
          <div className="bubble-glow bg-primary-500/80" />
          <div className="bubble-content">
            <span className="bubble-text">80%+ SCORE<br/>= REWARD</span>
          </div>
        </div>
        <div className="bubble w-32 h-32 top-[45%]" style={{ animation: 'bubble-drift-left 20s infinite linear', animationDelay: '-5s' }}>
          <div className="bubble-glow bg-secondary-500/70" />
          <div className="bubble-content">
            <span className="bubble-text">80%+ SCORE<br/>= REWARD</span>
          </div>
        </div>
        <div className="bubble w-24 h-24 top-[75%]" style={{ animation: 'bubble-drift-right 12s infinite linear', animationDelay: '-2s' }}>
          <div className="bubble-glow bg-accent-color/80" />
          <div className="bubble-content">
            <span className="bubble-text">SCORE 80%<br/>GET REWARD</span>
          </div>
        </div>
        
        {/* Bubbles with Apple Products */}
        <div className="bubble w-20 h-20 top-[30%]" style={{ animation: 'bubble-drift-left 25s infinite linear', animationDelay: '-8s' }}>
          <div className="bubble-glow bg-cyan-500/80" />
          <div className="bubble-content">
            <Smartphone className="text-white w-7 h-7 md:w-8 md:h-8 opacity-90 drop-shadow-md" />
          </div>
        </div>
        <div className="bubble w-28 h-28 top-[60%]" style={{ animation: 'bubble-drift-right 18s infinite linear', animationDelay: '-12s' }}>
          <div className="bubble-glow bg-amber-500/80" />
          <div className="bubble-content">
            <Laptop className="text-white w-9 h-9 md:w-10 md:h-10 opacity-90 drop-shadow-md" />
          </div>
        </div>
        <div className="bubble w-16 h-16 top-[10%]" style={{ animation: 'bubble-drift-left 15s infinite linear', animationDelay: '-3s' }}>
          <div className="bubble-glow bg-emerald-500/80" />
          <div className="bubble-content">
            <Watch className="text-white w-6 h-6 md:w-7 md:h-7 opacity-90 drop-shadow-md" />
          </div>
        </div>
        <div className="bubble w-18 h-18 top-[85%]" style={{ animation: 'bubble-drift-right 16s infinite linear', animationDelay: '-4s' }}>
          <div className="bubble-glow bg-rose-500/80" />
          <div className="bubble-content">
            <Headphones className="text-white w-7 h-7 md:w-8 md:h-8 opacity-90 drop-shadow-md" />
          </div>
        </div>
        
        {/* Fillers */}
        <div className="bubble w-40 h-40 top-[20%]" style={{ animation: 'bubble-drift-right 22s infinite linear', animationDelay: '-9s' }}>
          <div className="bubble-glow bg-indigo-500/60" />
        </div>
        <div className="bubble w-36 h-36 top-[5%]" style={{ animation: 'bubble-drift-right 28s infinite linear', animationDelay: '-11s' }}>
          <div className="bubble-glow bg-violet-500/50" />
        </div>
        <div className="bubble w-22 h-22 top-[90%]" style={{ animation: 'bubble-drift-left 19s infinite linear', animationDelay: '-6s' }}>
          <div className="bubble-glow bg-teal-500/70" />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card-saas w-full max-w-[440px] md:max-w-[480px] overflow-hidden relative z-10 flex flex-col shadow-bloom"
      >
        <div className="p-6 md:p-10 lg:p-12">
          <div className="flex flex-col items-center text-center">
            {/* Logo Section */}
            <div className="w-full transform transition-all duration-700 hover:scale-[1.02]">
              <PMISLogo variant="login" />
            </div>
          </div>

          <div className="-mt-10 md:-mt-16">
            <form onSubmit={handleLogin} className="space-y-3.5 md:space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 group-focus-within:text-primary-500 text-slate-400">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <input 
                    type="email" 
                    required
                    className="input-premium w-full !pl-12 !py-3.5 text-sm md:text-base text-slate-900" 
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 group-focus-within:text-primary-500 text-slate-400">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    className="input-premium w-full !pl-12 !pr-12 !py-3.5 text-sm md:text-base text-slate-900" 
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:bg-slate-100/50 hover:text-slate-600 transition-all"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-premium w-full !py-3.5 !text-base !rounded-xl shadow-xl mt-3 group overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 font-bold tracking-wide">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4.5 h-4.5 transition-all duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform" />
            </button>
          </form>
        </div>

          <footer className="mt-8 md:mt-12 pt-6 border-t border-slate-100/50 flex flex-col items-center">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
              PMIS
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

