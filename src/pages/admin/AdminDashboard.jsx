import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  Plus, 
  Search, 
  LogOut, 
  LayoutDashboard,
  Bell,
  Settings,
  MoreVertical,
  Activity,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertProvider';
import PMISLogo from '../../components/common/PMISLogo';

// Import sub-components
import UsersManagement from './Users';
import ExamsManagement from './ManageQuestions';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { showAlert, confirm } = useAlert();
  const [activeTab, setActiveTab] = useState('exams');
  const [stats, setStats] = useState({ users: 0, exams: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [isSubView, setIsSubView] = useState(false);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    try {
      const [uCount, eCount, aCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
        supabase.from('exams').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      ]);
      setStats({ users: uCount.count || 0, exams: eCount.count || 0, admins: aCount.count || 0 });
    } catch (error) {
      console.error('Stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to sign out of the administrator portal?',
      confirmText: 'Sign Out',
      type: 'danger',
      onConfirm: () => {
        logout();
        showAlert('Logged out successfully', 'success');
      }
    });
  };

  return (
    <div className="pb-10 bg-slate-50/30">


      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 pointer-events-none">
        <div className="bg-white/70 backdrop-blur-2xl rounded-full px-4 sm:px-8 py-2.5 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 ring-1 ring-slate-200/20 pointer-events-auto">
          <div className="flex items-center">
            <PMISLogo variant="navbar" />
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={() => setActiveTab('exams')} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-300 ${activeTab === 'exams' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === 'exams' ? 'text-white' : ''}`} />
              <span className="hidden sm:inline">Exam Management</span>
              <span className="sm:hidden">Exams</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('students')} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-300 ${activeTab === 'students' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'students' ? 'text-white' : ''}`} />
              <span className="hidden sm:inline">User & Access</span>
              <span className="sm:hidden">Users</span>
            </button>

            <div className="h-6 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
            
            <button 
              onClick={handleLogout} 
              className="group bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-5 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all flex items-center gap-2 ml-2"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className={`px-6 max-w-7xl mx-auto page-transition ${isSubView ? 'pt-36' : 'pt-32'}`}>





        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
              {activeTab === 'exams' && <ExamsManagement onSubViewChange={setIsSubView} />}
              {activeTab === 'students' && <UsersManagement />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${active ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-black/5'}`}>
    <Icon className={`w-4 h-4 ${active ? 'text-primary-500' : ''}`} />
    {label}
  </button>
);

export default AdminDashboard;
