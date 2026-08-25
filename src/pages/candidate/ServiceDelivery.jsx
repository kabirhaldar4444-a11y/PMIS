import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  User as UserIcon, 
  ShieldCheck, 
  Search, 
  ArrowLeft, 
  Check, 
  Clock, 
  ChevronRight, 
  FileCheck, 
  Award, 
  Filter, 
  Sparkles, 
  Users, 
  X, 
  ExternalLink,
  ChevronLeft,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  RefreshCw
} from 'lucide-react';
import CandidateNavbar from '../../components/layout/CandidateNavbar';
import DisclaimerOverlay from '../../components/DisclaimerOverlay';

// 12 Exact Service Delivery Milestones from Screenshot
export const SERVICE_DELIVERY_STEPS = [
  {
    id: 1,
    title: 'Candidate submitted the service enrollment',
    shortDesc: 'Enrollment Form Submitted',
    detail: 'Candidate registration form and initial service enrollment application submitted.'
  },
  {
    id: 2,
    title: 'Proposal Email sent',
    shortDesc: 'Proposal Dispatched',
    detail: 'Official proposal details, curriculum, and structure dispatched to candidate email.'
  },
  {
    id: 3,
    title: 'Payment received',
    shortDesc: 'Payment Verified',
    detail: 'Enrollment transaction verified and confirmed through the payment gateway.'
  },
  {
    id: 4,
    title: 'Invoice Sent',
    shortDesc: 'Invoice Dispatched',
    detail: 'Tax invoice and transaction receipt generated and delivered.'
  },
  {
    id: 5,
    title: 'Study material shared',
    shortDesc: 'Study Kit Shared',
    detail: 'Comprehensive curriculum guides, reference materials, and syllabi provided.'
  },
  {
    id: 6,
    title: 'Login credentials shared',
    shortDesc: 'Credentials Generated',
    detail: 'Secure portal access credentials generated and shared with candidate.'
  },
  {
    id: 7,
    title: 'Exam Cleared',
    shortDesc: 'Exam Passed',
    detail: 'Initial examination module attempted and successfully cleared.'
  },
  {
    id: 8,
    title: 'Completion Certificates Delivered',
    shortDesc: 'Certificate Delivered',
    detail: 'Verified course completion certificate issued and shared.'
  },
  {
    id: 9,
    title: 'Video Lectures Delivered',
    shortDesc: 'Lectures Accessible',
    detail: 'High-definition video lectures and recorded modules made accessible.'
  },
  {
    id: 10,
    title: 'Final Login Shared',
    shortDesc: 'Final Portal Access',
    detail: 'Final examination platform credentials and session parameters provided.'
  },
  {
    id: 11,
    title: 'Final Exam Cleared',
    shortDesc: 'Final Exam Passed',
    detail: 'Final accreditation assessment successfully completed and verified.'
  },
  {
    id: 12,
    title: 'PC verified',
    shortDesc: 'PC / Post-Check Verified',
    detail: 'Post-completion verification and candidate identity check fully completed.'
  }
];

// Rich sample candidates list (matching screenshot persona and diverse past/future users)
const DEFAULT_CANDIDATES = [
  {
    id: 'demo-1',
    full_name: 'Karunanithy Posanguraja',
    email: 'karunsun@gmail.com',
    phone: '9876543210',
    course_name: 'PMI Professional Master Certification',
    profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    service_delivery_step: 12,
    enrolled_date: '12 Jan 2026',
    status: 'completed'
  },
  {
    id: 'demo-2',
    full_name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '9811223344',
    course_name: 'Executive Project Management',
    profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    service_delivery_step: 12,
    enrolled_date: '05 Feb 2026',
    status: 'completed'
  },
  {
    id: 'demo-3',
    full_name: 'Priya Mukherjee',
    email: 'priya.m@techcorp.in',
    phone: '9822334455',
    course_name: 'Agile Leadership & Delivery',
    profile_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    service_delivery_step: 8,
    enrolled_date: '18 Feb 2026',
    status: 'in_progress'
  },
  {
    id: 'demo-4',
    full_name: 'Rajesh Venkataraman',
    email: 'rajesh.v@consulting.org',
    phone: '9833445566',
    course_name: 'Risk & Strategy Management',
    profile_photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    service_delivery_step: 5,
    enrolled_date: '22 Feb 2026',
    status: 'in_progress'
  },
  {
    id: 'demo-5',
    full_name: 'Sneha Patel',
    email: 'sneha.patel@globaledu.com',
    phone: '9844556677',
    course_name: 'PMIS Certified Specialist',
    profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    service_delivery_step: 12,
    enrolled_date: '28 Jan 2026',
    status: 'completed'
  },
  {
    id: 'demo-6',
    full_name: 'Vikramaditya Roy',
    email: 'vikram.roy@domain.net',
    phone: '9855667788',
    course_name: 'Enterprise Quality Assurance',
    profile_photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    service_delivery_step: 3,
    enrolled_date: '24 Feb 2026',
    status: 'in_progress'
  }
];

const ServiceDelivery = () => {
  const { user, profile } = useAuth();
  
  // State
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'in_progress'
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('directory'); // 'directory' | 'detail'
  const [selectedStepDetail, setSelectedStepDetail] = useState(null);

  // Fetch users from Supabase and merge with default personas
  useEffect(() => {
    fetchUsers();
  }, [user?.id]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch profiles
      const { data: dbProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'candidate');

      // 2. Fetch admissions
      const { data: dbAdmissions } = await supabase
        .from('admissions')
        .select('*');

      let combined = [...DEFAULT_CANDIDATES];

      // Insert logged in user at top if available
      if (profile && profile.role === 'candidate') {
        const currentUserObj = {
          id: profile.id,
          full_name: profile.full_name || 'My Profile',
          email: profile.email || user?.email || '',
          phone: profile.phone || '',
          course_name: profile.course_name || 'PMIS Candidate Program',
          profile_photo_url: profile.profile_photo_url || null,
          service_delivery_step: profile.service_delivery_step !== undefined && profile.service_delivery_step !== null ? Number(profile.service_delivery_step) : 12,
          enrolled_date: 'Current Session',
          is_current_user: true
        };
        combined = [currentUserObj, ...combined.filter(c => c.email !== currentUserObj.email)];
      }

      // Merge real database profiles
      if (dbProfiles && dbProfiles.length > 0) {
        dbProfiles.forEach(p => {
          if (!combined.some(c => c.id === p.id || c.email === p.email)) {
            combined.push({
              id: p.id,
              full_name: p.full_name || 'Candidate',
              email: p.email,
              phone: p.phone,
              course_name: p.course_name || 'Enrolled Candidate',
              profile_photo_url: p.profile_photo_url,
              service_delivery_step: p.service_delivery_step !== undefined && p.service_delivery_step !== null ? Number(p.service_delivery_step) : 12,
              enrolled_date: p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified'
            });
          }
        });
      }

      // Merge admissions
      if (dbAdmissions && dbAdmissions.length > 0) {
        dbAdmissions.forEach(a => {
          if (!combined.some(c => c.email === a.email)) {
            combined.push({
              id: a.id,
              full_name: a.full_name,
              email: a.email,
              phone: a.phone,
              course_name: a.course_name || 'Admission Enrolled',
              profile_photo_url: a.profile_photo_url,
              service_delivery_step: 12,
              enrolled_date: a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'
            });
          }
        });
      }

      setUsersList(combined);

      // If user came directly to /servicedelivery, set initial selected user to Karunanithy or current candidate if desired
    } catch (err) {
      console.error('Error loading users:', err);
      setUsersList(DEFAULT_CANDIDATES);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        (u.full_name || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.phone || '').includes(term) ||
        (u.course_name || '').toLowerCase().includes(term);

      const step = u.service_delivery_step ?? 12;
      const isCompleted = step >= 12;

      if (statusFilter === 'completed') return matchesSearch && isCompleted;
      if (statusFilter === 'in_progress') return matchesSearch && !isCompleted;
      return matchesSearch;
    });
  }, [usersList, searchTerm, statusFilter]);

  // Open User Detail View
  const handleSelectUser = (candidate) => {
    setSelectedUser(candidate);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick switch between users in detail view
  const handlePreviousUser = () => {
    if (!selectedUser) return;
    const currentIndex = filteredUsers.findIndex(u => u.id === selectedUser.id);
    if (currentIndex > 0) {
      setSelectedUser(filteredUsers[currentIndex - 1]);
    } else {
      setSelectedUser(filteredUsers[filteredUsers.length - 1]);
    }
  };

  const handleNextUser = () => {
    if (!selectedUser) return;
    const currentIndex = filteredUsers.findIndex(u => u.id === selectedUser.id);
    if (currentIndex < filteredUsers.length - 1) {
      setSelectedUser(filteredUsers[currentIndex + 1]);
    } else {
      setSelectedUser(filteredUsers[0]);
    }
  };

  // Step updater for the active candidate
  const handleUpdateCurrentStep = async (newStep) => {
    if (!selectedUser) return;
    const updated = { ...selectedUser, service_delivery_step: newStep };
    setSelectedUser(updated);
    setUsersList(prev => prev.map(u => u.id === selectedUser.id ? updated : u));

    // Persist to Supabase if valid UUID
    try {
      if (selectedUser.id && !selectedUser.id.startsWith('demo-')) {
        await supabase
          .from('profiles')
          .update({ service_delivery_step: newStep })
          .eq('id', selectedUser.id);
      }
    } catch (e) {
      console.warn('Database sync skipped for mock user');
    }
  };

  const activeStep = selectedUser?.service_delivery_step ?? 12;
  const isSelectedCompleted = activeStep >= 12;

  return (
    <div className="min-h-screen pb-24 bg-slate-50 relative overflow-hidden font-inter selection:bg-primary-500/30">
      {/* Background Lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="bubble w-[34rem] h-[34rem] top-[-10%] left-[-5%]" style={{ animation: 'bubble-drift-right 60s infinite linear' }}>
          <div className="bubble-glow bg-blue-400/10" />
        </div>
        <div className="bubble w-[30rem] h-[30rem] bottom-[-10%] right-[-5%]" style={{ animation: 'bubble-drift-left 50s infinite linear' }}>
          <div className="bubble-glow bg-emerald-400/10" />
        </div>
      </div>

      <div className="relative z-10">
        <DisclaimerOverlay user={user} profile={profile} />

        {/* Top Floating Glass Navbar */}
        <CandidateNavbar activeTab="service_delivery" />

        <main className="pt-36 sm:pt-40 px-4 sm:px-8 max-w-7xl mx-auto">
          
          <AnimatePresence mode="wait">
            
            {/* ========================================================================= */}
            {/* 1. DIRECTORY VIEW: USER CARDS GRID & SEARCH CONTROLS                      */}
            {/* ========================================================================= */}
            {viewMode === 'directory' && (
              <motion.div
                key="directory"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* Header Title & Summary */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-sm">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-black uppercase tracking-wider mb-1">
                      <Users className="w-3.5 h-3.5" /> Candidate Directory
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-outfit font-black text-slate-900 tracking-tight">
                      Service Delivery Portal
                    </h1>
                    <p className="text-sm font-medium text-slate-500">
                      Select any candidate card below to view their live 12-stage service delivery timeline.
                    </p>
                  </div>

                  {/* Quick Stat Badges */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
                      <span className="text-xl font-black text-slate-900 font-outfit">{usersList.length}</span>
                    </div>
                    <div className="bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Completed</span>
                      <span className="text-xl font-black text-emerald-700 font-outfit">
                        {usersList.filter(u => (u.service_delivery_step ?? 12) >= 12).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white/80 backdrop-blur-xl p-4 sm:p-5 rounded-[2rem] border border-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                  
                  {/* Search Input Box */}
                  <div className="relative w-full md:w-[420px]">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search candidates by name, email, or phone..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                        statusFilter === 'all'
                          ? 'bg-slate-900 text-white shadow-md scale-[1.02]'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All ({usersList.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('completed')}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                        statusFilter === 'completed'
                          ? 'bg-emerald-600 text-white shadow-md scale-[1.02]'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Completed ({usersList.filter(u => (u.service_delivery_step ?? 12) >= 12).length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('in_progress')}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                        statusFilter === 'in_progress'
                          ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      In Progress ({usersList.filter(u => (u.service_delivery_step ?? 12) < 12).length})
                    </button>
                  </div>
                </div>

                {/* Candidate Cards Grid */}
                {filteredUsers.length === 0 ? (
                  <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-16 text-center border border-slate-200/60 shadow-inner">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-slate-800">No Candidates Found</h3>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or filter tags.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((candidate, idx) => {
                      const step = candidate.service_delivery_step ?? 12;
                      const isComplete = step >= 12;
                      const stepObj = SERVICE_DELIVERY_STEPS.find(s => s.id === step) || SERVICE_DELIVERY_STEPS[11];

                      return (
                        <motion.div
                          key={candidate.id || idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          onClick={() => handleSelectUser(candidate)}
                          className="glass-card-saas p-6 sm:p-7 rounded-[2.5rem] bg-white/70 hover:bg-white border border-white/90 hover:border-blue-200 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(59,130,246,0.12)] transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Top: Photo, Verification & Status */}
                            <div className="flex items-start justify-between gap-4 mb-5">
                              <div className="relative">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-md flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                  {candidate.profile_photo_url ? (
                                    <img 
                                      src={candidate.profile_photo_url} 
                                      alt={candidate.full_name} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                                      {(candidate.full_name || 'C').charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                  <Check className="w-3 h-3 text-white stroke-[3]" />
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                                isComplete 
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                                  : 'bg-blue-50 text-blue-600 border border-blue-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
                                {isComplete ? 'Completed' : `Step ${step}/12`}
                              </div>
                            </div>

                            {/* Candidate Info */}
                            <div className="space-y-1 mb-6">
                              <h3 className="text-lg font-outfit font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                                {candidate.full_name}
                              </h3>
                              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 truncate">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" /> {candidate.email}
                              </p>
                              {candidate.course_name && (
                                <p className="text-[11px] font-bold text-slate-600 pt-1 flex items-center gap-1.5 line-clamp-1">
                                  <BookOpen className="w-3 h-3 text-primary-500 shrink-0" /> {candidate.course_name}
                                </p>
                              )}
                            </div>

                            {/* Milestone Tracker Bar on Card */}
                            <div className="space-y-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 mb-6">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-500 truncate max-w-[170px]">
                                  {stepObj.shortDesc}
                                </span>
                                <span className="font-black text-slate-900 font-outfit">
                                  {Math.round((step / 12) * 100)}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isComplete ? 'bg-emerald-500' : 'bg-blue-600'
                                  }`} 
                                  style={{ width: `${(step / 12) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => handleSelectUser(candidate)}
                            className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white hover:bg-blue-600 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-blue-500/20"
                          >
                            <span>View Service Delivery</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* 2. DETAIL VIEW: EXACT SCREENSHOT REPLICATION (12 GREEN CHECK STEPS)       */}
            {/* ========================================================================= */}
            {viewMode === 'detail' && selectedUser && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* Back Button & User Switcher Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <button
                    onClick={() => setViewMode('directory')}
                    className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-black uppercase text-xs tracking-wider shadow-sm border border-slate-200/80 transition-all group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to All Users
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreviousUser}
                      className="px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-sm border border-slate-200 transition-all flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev Candidate
                    </button>
                    <button
                      onClick={handleNextUser}
                      className="px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-sm border border-slate-200 transition-all flex items-center gap-1"
                    >
                      Next Candidate <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* AESTHETIC SCREENSHOT VIEW CONTAINER */}
                <div className="relative bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-white/90 p-6 sm:p-9 shadow-[0_20px_50px_rgba(109,40,217,0.06)] space-y-8 overflow-hidden">
                  
                  {/* Subtle Ambient Brand Glow inside card */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-500/5 via-indigo-500/5 to-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-0" />
                  
                  {/* Top Candidate & Header Row */}
                  <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100/90">
                    
                    {/* Left: User Avatar & Info */}
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-white ring-2 ring-violet-500/20 shadow-lg shadow-violet-500/10 flex items-center justify-center">
                          {selectedUser.profile_photo_url ? (
                            <img 
                              src={selectedUser.profile_photo_url} 
                              alt={selectedUser.full_name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-violet-600 via-indigo-600 to-emerald-600 flex items-center justify-center text-white font-black text-2xl shadow-inner">
                              {(selectedUser.full_name || 'C').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <h2 className="text-xl sm:text-2xl font-outfit font-black text-slate-900 tracking-tight">
                          {selectedUser.full_name}
                        </h2>
                        <p className="text-xs sm:text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-violet-500/70" /> {selectedUser.email}
                        </p>
                      </div>
                    </div>

                    {/* Right: Service Delivery Heading & Status Badge */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-4 w-full lg:w-auto">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-outfit font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 tracking-tight">
                        Service Delivery
                      </h1>

                      {/* Status Pill Badge with Logo Color Accent */}
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-300/60 px-4 py-1.5 rounded-full shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">STATUS</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                          <span className="text-[11px] sm:text-xs font-black text-emerald-700 tracking-wide whitespace-nowrap">
                            Service Delivery Completed
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* 12-STEP HORIZONTAL PROGRESS STEPPER (AESTHETIC LOGO COLORS - PERMANENTLY 100% COMPLETED) */}
                  <div className="relative z-10 pt-1">
                    <div className="relative pb-4 overflow-x-auto no-scrollbar">
                      
                      {/* Horizontal Track Container */}
                      <div className="min-w-[940px] relative py-5 px-3">
                        
                        {/* Background Base Line */}
                        <div className="absolute top-[48px] left-6 right-6 h-[3px] bg-slate-200/80 rounded-full -z-0">
                          {/* Active Progress Gradient Bar matching Logo Shield & Accent (Violet -> Indigo -> Emerald) */}
                          <div 
                            className="h-full bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                            style={{ width: '100%' }}
                          />
                        </div>

                        {/* 12 Steps Grid */}
                        <div className="grid grid-cols-12 gap-1.5 relative z-10">
                          {SERVICE_DELIVERY_STEPS.map((step) => {
                            return (
                              <div 
                                key={step.id} 
                                onClick={() => setSelectedStepDetail(step)}
                                className="flex flex-col items-center group cursor-pointer"
                              >
                                {/* Top Step Number Badge */}
                                <div className="w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center text-[10px] font-black transition-all duration-300 mb-1.5 shadow-sm bg-gradient-to-br from-violet-50 to-emerald-50 border-emerald-500 text-emerald-800 group-hover:scale-115 group-hover:border-violet-500 group-hover:text-violet-700">
                                  {step.id}
                                </div>

                                {/* Checkmark Orb Node */}
                                <div className="relative my-0.5">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-[0_3px_10px_rgba(16,185,129,0.45)] ring-2 ring-emerald-400/30 transition-all duration-300 group-hover:scale-120">
                                    <Check className="w-3.5 h-3.5 stroke-[3] drop-shadow-sm text-white" />
                                  </div>
                                </div>

                                {/* Step Label Text Underneath Node */}
                                <div className="mt-2.5 text-center px-0.5">
                                  <p className="text-[10px] font-bold leading-tight max-w-[78px] mx-auto text-slate-800 group-hover:text-indigo-600 transition-colors duration-200">
                                    {step.title}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                      </div>

                      {/* Mobile hint */}
                      <div className="flex lg:hidden items-center justify-center gap-2 pt-1 text-slate-400 text-[11px] font-semibold">
                        <span>← Swipe horizontally to view all 12 stages →</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Milestone Verification Breakdown Cards */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-outfit font-black text-slate-900">Milestone Verification Details</h3>
                        <p className="text-xs font-medium text-slate-500">Official log of delivery pipeline execution</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">Progress</span>
                      <p className="text-lg font-outfit font-black text-emerald-600">
                        {Math.min(12, activeStep)} of 12 Completed ({Math.round((Math.min(12, activeStep) / 12) * 100)}%)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {SERVICE_DELIVERY_STEPS.map((step) => {
                      const isCompleted = step.id <= activeStep;
                      return (
                        <div
                          key={step.id}
                          className={`p-5 rounded-2xl border transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-white/80 border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300' 
                              : 'bg-slate-50/50 border-slate-200/60 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                              isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {step.id}
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">{step.detail}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </main>
      </div>
    </div>
  );
};

export default ServiceDelivery;
