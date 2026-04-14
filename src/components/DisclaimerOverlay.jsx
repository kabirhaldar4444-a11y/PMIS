import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAlert } from '../context/AlertProvider';

const DisclaimerOverlay = ({ user, profile, onAccepted }) => {
  const { showAlert } = useAlert();
  const [disclaimerCheckbox, setDisclaimerCheckbox] = useState(false);
  const [loading, setLoading] = useState(false);

  // Smart Logic: Force showing every time before registration is complete (Session-based)
  const isSessionAccepted = typeof window !== 'undefined' && sessionStorage.getItem(`disclaimer_accepted_${user?.id}`);
  
  if (!profile) return null;
  
  // Rule: Only hide if (DB flag is true AND profile is complete) OR its already accepted in THIS session
  if ((profile.disclaimer_accepted === true && profile.profile_completed === true) || isSessionAccepted) {
    return null;
  }

  const handleAcceptDisclaimer = async () => {
    if (!disclaimerCheckbox) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ disclaimer_accepted: true })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Save to session to allow this registration session to proceed
      sessionStorage.setItem(`disclaimer_accepted_${user?.id}`, 'true');
      
      if (onAccepted) onAccepted();
      showAlert('Terms accepted successfully', 'success');
      
      // Force an immediate refresh to sync database state with UI
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-3xl border border-white/50 w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          <div className="p-10 border-b border-slate-100/50 flex items-center gap-4 bg-gradient-to-r from-primary-500/5 to-transparent">
            <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 leading-tight">Privacy & Disclaimer</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Please review our terms of service</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
              <p className="text-slate-600 leading-relaxed text-[15px] font-medium whitespace-pre-wrap">
1. Service Delivery / Platform
• One attempt allowed for Pre-Board and Final exams
• Soft copy certificate issued within 15 days after final exam
• No physical certificate (only digital)

Pre-Exam Reward System:
• 80%+ score = eligible for rewards
• 5+ gift options (₹50K–₹1L range)
• Delivery in 45–60 days
• Tracking shared via email
• OTP required for delivery
• Company may use student photos for promotion

2. Privacy Policy
• Data used for enrollment, payments, exams, communication, and improvement
• Data is NOT sold or shared commercially
• Stored securely with encryption and limited access
• Payment data handled securely
• Cookies used for login and analytics
• Data retained only as needed
• Users can access, correct, or delete their data
• Policy updates may occur anytime

3. Terms & Conditions
• One attempt allowed for exams
• Certificate issued after final exam
• Refund rules apply (see below)
• Reward system based on performance (80%+)

4. Refund Policy
• No refund after exam attempt or content access
• Refund allowed only within 24 hours of payment
• 90% refund (10% deduction mandatory)
• Processing time: 5–7 working days (+7 days bank time)
• Request must include name, email, course, receipt, and reason
• No 100% refund under any condition

Final Key Points
• Strict no-refund after usage
• Short refund window (24 hours)
• Digital-only system
• Performance-based rewards
• Strong data protection policies
              </p>
            </div>
          </div>

          <div className="p-10 bg-slate-50/80 border-t border-slate-100 flex flex-col gap-6">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  id="disclaimer-check"
                  className="peer sr-only" 
                  checked={disclaimerCheckbox}
                  onChange={() => setDisclaimerCheckbox(!disclaimerCheckbox)}
                />
                <div className="w-6 h-6 border-2 border-slate-200 rounded-lg group-hover:border-primary-500 transition-all peer-checked:bg-primary-500 peer-checked:border-primary-500" />
                <CheckCircle className="absolute inset-0 w-6 h-6 text-white scale-0 peer-checked:scale-75 transition-transform" />
              </div>
              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">I agree and continue to the platform</span>
            </label>

            <button 
              onClick={handleAcceptDisclaimer}
              disabled={!disclaimerCheckbox || loading}
              className="w-full btn-premium !py-5 !rounded-2xl !text-base shadow-xl hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              Continue to Platform
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DisclaimerOverlay;
