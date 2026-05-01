import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  MapPin, 
  Upload, 
  Camera, 
  ChevronDown, 
  ArrowRight, 
  Loader2,
  CheckCircle,
  Video,
  X,
  Image as ImageIcon,
  Search,
  PenTool,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import SignatureCanvas from '../../components/SignatureCanvas';
import DisclaimerOverlay from '../../components/DisclaimerOverlay';
import { useAlert } from '../../context/AlertProvider';
import { indianStatesAndCities } from '../../utils/indiaLocationData';
import PMISLogo from '../../components/common/PMISLogo';

// --- SEARCHABLE DROPDOWN COMPONENT ---
const SearchableDropdown = ({ value, onChange, options, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`input-premium w-full flex items-center justify-between cursor-pointer transition-all duration-200 ${disabled ? 'opacity-50 pointer-events-none bg-slate-50' : 'bg-white hover:border-primary-500/50 focus-within:ring-2 focus-within:ring-primary-500/50'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input 
                autoFocus
                placeholder="Search..." 
                className="w-full text-sm outline-none py-1"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <ul className="max-h-60 overflow-y-auto w-full p-2">
              {filtered.length > 0 ? filtered.map(opt => (
                <li 
                  key={opt} 
                  className="px-4 py-2 hover:bg-primary-500/5 hover:text-primary-600 rounded-xl cursor-pointer text-sm font-medium transition-colors"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {opt}
                </li>
              )) : (
                <li className="p-4 text-center text-sm text-slate-400">No results found</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- WEBRTC CAMERA MODAL COMPONENT ---
const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(mediaStream => {
          setStream(mediaStream);
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
          setError('');
        })
        .catch(err => setError('Camera access denied or unavailable. Please enable permissions.'));
    } else {
      if (stream) stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }, [isOpen]);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 400, 400);
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `live_capture_${Date.now()}.png`, { type: 'image/png' });
          onCapture(file);
          onClose();
        }
      }, 'image/png', 0.85);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl max-w-sm w-full relative"
          >
            <button onClick={onClose} className="absolute top-6 right-6 z-10 w-10 h-10 bg-black/5 hover:bg-black/10 text-slate-800 rounded-full flex items-center justify-center transition-all">
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 text-center border-b border-slate-100">
              <h3 className="font-outfit font-black text-2xl text-slate-900">Identity Scan</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Align your face in the center</p>
            </div>

            <div className="bg-slate-900 aspect-square relative flex items-center justify-center overflow-hidden">
               {error ? (
                 <p className="text-amber-500 text-sm px-8 text-center font-medium">{error}</p>
               ) : (
                 <>
                   <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                   <div className="absolute inset-0 border-[3px] border-white/20 rounded-full m-10 pointer-events-none" />
                   <canvas ref={canvasRef} width="400" height="400" className="hidden" />
                 </>
               )}
            </div>

            <div className="p-8 bg-slate-50/80">
               <button 
                 onClick={captureFrame} disabled={!!error}
                 className="w-full btn-premium !py-5 !rounded-2xl transition-all shadow-xl shadow-primary-500/20"
               >
                  Verify Identity
               </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- MAIN COMPONENT ---
const CompleteProfile = () => {
  const { user, profile } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLegalAccepted, setIsLegalAccepted] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null); // 'denied' | 'unavailable' | null
  const isGpsDetecting = useRef(false);
  
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    phone: '',
    state: '',
    city: '',
    addressLine: '',
    pincode: ''
  });

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress('Not Detected'));
  }, []);

  // Smart PIN Code → auto-fill State & City (only when user types manually)
  useEffect(() => {
    if (isGpsDetecting.current) return; // skip when GPS already filled everything
    const fetchLocationByPincode = async () => {
      if (formData.pincode.length === 6) {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`);
          const data = await res.json();
          if (data && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            setFormData(prev => ({
              ...prev,
              state: postOffice.State,
              city: postOffice.Name || postOffice.District || prev.city
            }));
            showAlert(`Location auto-filled for PIN ${formData.pincode}`, 'success');
          }
        } catch (err) {
          console.error('Pincode lookup failed', err);
        }
      }
    };
    fetchLocationByPincode();
  }, [formData.pincode]);

  const handleDetectLocation = () => {
    // Prevent duplicate calls if already running
    if (detectingLocation) return;
    setDetectingLocation(true);
    isGpsDetecting.current = true;

    const done = (pincode, state, city, address) => {
      setFormData(prev => ({
        ...prev,
        pincode: pincode || prev.pincode,
        state:   state   || prev.state,
        city:    city    || prev.city,
        addressLine: address || prev.addressLine
      }));
      showAlert('📍 Location detected successfully!', 'success');
      setDetectingLocation(false);
      setTimeout(() => { isGpsDetecting.current = false; }, 800);
    };

    const fail = () => {
      showAlert('Could not detect location. Please fill manually.', 'error');
      setDetectingLocation(false);
      isGpsDetecting.current = false;
    };

    // Step 2: given lat/lon → reverse geocode for PIN via Nominatim
    const reverseGeocode = async (lat, lon, fallbackState, fallbackCity) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const d = await res.json();
        if (d?.address?.postcode) {
          const pincode = d.address.postcode.replace(/\D/g, '').substring(0, 6);
          const city = d.address.suburb || d.address.village || d.address.town || d.address.city || fallbackCity || '';
          const street = [d.address.road, d.address.neighbourhood, d.address.suburb].filter(Boolean).join(', ');
          done(pincode, d.address.state || fallbackState, city, street);
        } else {
          // No PIN from Nominatim — apply what we have from IP
          done('', fallbackState, fallbackCity, '');
        }
      } catch {
        done('', fallbackState, fallbackCity, '');
      }
    };

    // Step 1a: GPS → most precise
    const tryGPS = () => {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          setLocationError(null);
          reverseGeocode(latitude, longitude, '', '');
        },
        (err) => {
          if (err.code === 1) {
            // PERMISSION_DENIED — show the modal, do NOT auto-fill via IP
            setLocationError('denied');
            setDetectingLocation(false);
            isGpsDetecting.current = false;
          } else {
            // POSITION_UNAVAILABLE or TIMEOUT — silent IP fallback is fine
            setLocationError('unavailable');
            tryIPFallback();
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    };

    // Step 1b: IP fallback → geojs.io (verified working, no CORS, no rate-limit)
    const tryIPFallback = async () => {
      try {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const d = await res.json();
        if (d && d.city) {
          // geojs gives lat/lon too — use them for precise Nominatim PIN lookup
          reverseGeocode(d.latitude, d.longitude, d.region, d.city);
        } else {
          fail();
        }
      } catch {
        fail();
      }
    };

    if ('geolocation' in navigator) {
      tryGPS();
    } else {
      tryIPFallback();
    }
  };

  const [files, setFiles] = useState({
    photo: null,
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    signature: null
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleFileUpload = async (file, bucketPath, bucketName = 'aadhaar_cards') => {
    if (!file) return null;
    const fileExt = file.name ? file.name.split('.').pop() : (file.type ? file.type.split('/')[1] : 'png');
    const fileName = `${user.id}/${bucketPath}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return publicUrl;
  };

  const sendEmailNotification = async (candidateData) => {
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '18c218dd-3103-4a67-9dd7-66a7241c97de',
          subject: `KYC Form: ${candidateData.fullName}`,
          from_name: "PMIS Portal",
          recipient: import.meta.env.VITE_ADMIN_EMAIL || 'contact@pmiusservices.com',
          message: `
=========================================
NEW CANDIDATE KYC SUBMISSION
=========================================

CANDIDATE INFORMATION:
----------------------
• Full Name: ${candidateData.fullName}
• Email ID: ${candidateData.email}
• Residential Address: ${candidateData.addressLine}
• PIN Code: ${candidateData.pincode}
• Location: ${candidateData.city}, ${candidateData.state}

VERIFICATION METADATA:
----------------------
• IP Address: ${ipAddress}
• Submission Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

=========================================
KYC DOCUMENT LINKS
=========================================
• Live Photo        : ${candidateData.photoUrl || 'Not uploaded'}
• Aadhaar Front     : ${candidateData.frontUrl || 'Not uploaded'}
• Aadhaar Back      : ${candidateData.backUrl  || 'Not uploaded'}
• PAN Card          : ${candidateData.panUrl   || 'Not uploaded'}
• Signature         : ${candidateData.signatureUrl || 'Not uploaded'}

=========================================
VERBATIM LEGAL ACKNOWLEDGEMENTS
=========================================

[SERVICE DELIVERY]
-----------------------------------------
• Enrollment Process: Customers visit the PMIS website and fill out the Enrollment Form. After form submission, Our team connects with the customer. A detailed email is shared explaining the complete process flow and fee structure. Payments may also be accepted directly through an authorized professional expert trainer account, where applicable.
• Process Explanation & Confirmation: During the call, the team explains the course structure, learning journey, and assessment-to-certification flow. The customer then confirms their participation in the program.
• Fee Payment: Upon successful completion of the fee payment, a GST-compliant invoice is issued within 6 hours. Pre-examination study materials are shared with the learner within 24 hours.
• Pre-Exam: A Pre-Exam is conducted within 24–48 hours of fee payment. This exam assesses the customer’s initial understanding of the selected domain. Before the exam, the Guidance Team connects to explain the exam process.
• Pre-Exam Result & Pre-Board Professional Certificate: Results are shared within 24–48 hours via email. A Pre-Board Professional Certificate is issued with “Under Training” mentioned.
• Reward Eligibility: Customers scoring above 80% become eligible for a gift. One gift can be selected from four available options, which will be delivered accordingly.
• Self-Paced Training: Access to recorded video lectures is shared within 15 days on payment. Training duration is 90–120 days.
• Final Exam: A Final Exam is conducted between 90-120 days.
• Final Certificate: Upon successful completion of all requirements, the Final Certificate is issued. The certificate will clearly state the status as “Certified.”
• Continuous Support: Throughout the entire journey, the PMIS team remains in contact for guidance and support.

[TERMS & CONDITIONS]
-----------------------------------------
• Course Duration and Delivery: The complete course will be delivered within 90 to 120 days from the date of enrollment. After enrollment, learners will receive an Invoice, Study Materials and video lectures within 10 working days of making the payment. A Pre-Board Exam will be scheduled 24 to 48 hours after payment, accessible via the official PMIS exam portal. An Initial PC Softcopy (indicating “Under Training” and course details), will be provided after going through the pre-board exam within 48 to 72 hours. The final online exam must be attended between 90 to 120 days after enrollment. Upon successful exam completion, the Final PC Softcopy will be emailed to the candidate, indicating “Successfully Certified”.
• Training Format: No live training sessions will be provided. Study material and training videos will be shared once only via email after the enrollment. Training videos and study materials are non-transferable and intended solely for enrolled candidates. Upon successful completion of the program, the certificate will be released with an abbreviation format. For an example if the course you have enrolled in "Resilience Coach Training", then "RCT" will appear on your certificate, similarly if the course name is Decision Making Mastery Training, on the certificate it will show "DMMT"
• Exam Policy: Multiple exam attempts are not permitted, for pre- board as well as final exam. The Final PC Softcopy will be issued within 15 days after the final exam attempt. No hard copy certificates will be delivered; all documents will be sent in digital format only.
• Refund Policy: No refund will be applicable after attempting any exam (Pre-Board or Final). A 90% refund is applicable before attempting any exam. There is no 100% refund policy. A 10% deduction will apply to all refunds to cover the cost of digital study materials and content access.
• Pre-Examination Reward Policy: Candidates who secure 80% or above in the designated pre-examination will be eligible to receive a complimentary gift. Eligible candidates will be provided with 5+ options for gift items worth upto 50k-100k. The final gift selection will be subject to availability and company discretion. By qualifying for the reward, candidates consent to the use and display of their photograph on the company’s official website and promotional platforms. Gift items will be dispatched within 45 to 60 days from the date of result declaration. All gifts will be accompanied by the manufacturer’s warranty, where applicable. Courier tracking details will be shared via registered email once the item has been dispatched. For delivery verification, a one-time password (OTP) required by the courier partner will be shared with the recipient by the company. The company reserves the right to modify, substitute, or discontinue the reward offer at any time without prior notice, in accordance with applicable laws and operational requirements.
• General Terms: All timelines mentioned are approximate and subject to variation depending on course type and customer engagement. Study materials and videos are shared once and cannot be reissued. By enrolling, candidates agree to comply with the above terms and conditions.

[PRIVACY POLICY]
-----------------------------------------
• Information We Collect: We collect the following types of information to ensure smooth operation of our services: Personal Information (Your name, email address, contact number, and country of residence collected during registration or inquiries), Payment Information (Transaction details. We do not store complete payment card or crypto wallet details), Course and Usage Data (Information about the courses you enroll in, your progress, assessments, and interactions with our online learning platform), Technical Information (Device type, IP address, browser version, and cookies to improve website performance and user experience).
• How We Use Your Information: We use your information to: Process your course enrollment and payments, Provide access to study materials, exams, and course completion certificates, Communicate important updates, reminders, and support-related information, Improve course quality, website functionality, and user experience, Maintain compliance with our internal policies and applicable laws. We do not sell, trade, or rent your personal information to any third party.
• Data Storage and Security: All personal data is stored securely in encrypted databases. Only authorized PMIS personnel have access to user data. We regularly update our systems and employ security measures such as SSL encryption to protect against unauthorized access, alteration, or disclosure.
• Payment & Financial Data: All personal data is stored securely in encrypted databases. Only authorized PMIS personnel have access to user data. We regularly update our systems and employ security measures such as SSL encryption to protect against unauthorized access, alteration, or disclosure.
• Use of Cookies: Our website uses cookies to: Enhance your browsing experience, Save login preferences, Analyze site traffic and improve user experience. You can choose to disable cookies from your browser settings; however, some website features may not function properly as a result.
• Data Retention: We retain your personal information for as long as necessary to fulfill course delivery and legal obligations. Once no longer needed, your data will be securely deleted or anonymized.
• Third-Party Links: Our website may contain links to third-party websites (e.g., payment gateways or educational partners). PMIS is not responsible for the privacy practices or content of these external sites.
• Your Rights: You have the right to: Access the information we hold about you, Request correction or deletion of inaccurate data, Withdraw consent for marketing communications at any time. To exercise these rights, please contact our support team at support@PMIS.com.
• Policy Updates: PMIS OPC Pvt Ltd and PayG, reserves the right to update or modify this Privacy Policy at any time without prior notice. The revised version will be posted on our website with an updated effective date.

[REFUND POLICY]
-----------------------------------------
• No Refund After Exam Attempt: Once a candidate has attempted any exam — whether it is the Pre-Board Exam or the Final Exam — no refund will be applicable under any circumstances. This policy ensures the integrity of our course access and examination system, as study materials and evaluations are already utilized at that stage.
• 90% Refund Before Exam Attempt: If a candidate wishes to cancel their enrollment before attempting the pre-exam, they are eligible for a 90% refund of the total course fee. Refund will be only be provided if the customer raised the request within 24 hours of making the payment and they must not attend the exam otherwise no refund will be initiated to them. The refund request must be raised in writing via email to the official PMIS support team. Refund processing time is 5-7 working days once the refund request is approved it may take an additional 7 working days to get credited into the customer's bank account from which payment was made.
• No 100% Refund Policy: Please note that PMIS does not offer a 100% refund under any condition. This is due to administrative, processing, and content access costs incurred upon enrollment.
• Refund Request Procedure: To request a refund, the candidate must email support@PMIS.com with their full name, registered email ID, course name, payment receipt, and reason for cancellation. Requests without complete details may face delays in processing.
• 10% Deduction on All Refunds: All approved refunds will include a 10% deduction to cover costs associated with digital content delivery, study materials, and platform usage. This deduction applies uniformly to all refund cases.
• Special Note - Refunds are not applicable in the following cases: Partial Course Completion (If a candidate has completed only a portion of the course, no refund will be issued for the remaining content), Delayed Course Progress (Refunds will not be provided due to delays in completing the course at the candidate’s own pace), Accessed Content (Once study materials, training videos, or pre-board assessments have been accessed, refunds will not be applicable), Dissatisfaction with Course Content (Refunds cannot be claimed solely based on personal preferences, expectations, or dissatisfaction with the course material).

[AGREEMENT TO POLICIES]
-----------------------------------------
• By enrolling in any course offered by PMIS Education, candidates acknowledge and agree to comply with all policies, terms of service, and refund rules. Enrolling confirms that the candidate has read, understood, and accepted the terms outlined in the policies, including payment, course access, exam schedules, and refund rules. Candidates are responsible for reviewing these policies prior to enrollment, as continued use of the course materials implies acceptance of all terms.
• Independent Organization: PMIS (OPC) PVT. LTD. is an independent training and service provider. We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with any other institute, organization, or governing body. All rights related to our services, content, and training materials are solely reserved by PMIS.
• No Guarantee of Employment or Monetary Benefit: Our programs are designed for skill development and professional enhancement only. We do not guarantee any monetary benefit, job placement, promotion, or financial gain as a result of completing our training or certification programs.
• Third-Party Recommendations: PMIS shall not be held responsible for any financial, personal, or professional loss incurred by customers who enroll in our services based on third-party recommendations, promotions, or representations. Any such engagement is strictly at the discretion and responsibility of the individual.

=========================================
LEGAL ACKNOWLEDGEMENT
=========================================
1. IDENTITY VERIFICATION:
Candidate authorizes live photo capture for identity authentication and anti-proxy measures.

2. EMPLOYMENT DISCLAIMER:
Candidate acknowledges certification does not guarantee employment, placement, or financial increases.

3. ACADEMIC INTEGRITY:
Candidate agrees to complete exams independently without unauthorized materials or AI assistance.

4. LIMITATION OF LIABILITY:
Portal is not liable for technical failures or candidate-side connectivity issues during examinations.

=========================================
CANDIDATE STATUS
=========================================
• Comprehensive Policies Accepted: YES
• Legal Acknowledgement Accepted: YES
• Live Identity Verification: COMPLETED
          `
        })
      });
      return response.ok;
    } catch (err) {
      console.error('Email Error:', err);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      showAlert('Invalid Mobile Number. Must be 10 digits.', 'error');
      return;
    }
    if (!files.photo || !files.signature || !files.aadhaarFront || !files.aadhaarBack || !files.panCard) {
      showAlert('Please provide all required documents, PAN card, and signature.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const [photoUrl, frontUrl, backUrl, panUrl, signatureUrl] = await Promise.all([
        handleFileUpload(files.photo, 'photo', 'candidate_documents'),
        handleFileUpload(files.aadhaarFront, 'aadhaar_front', 'aadhaar_cards'),
        handleFileUpload(files.aadhaarBack, 'aadhaar_back', 'aadhaar_cards'),
        handleFileUpload(files.panCard, 'pan_card', 'candidate_documents'),
        handleFileUpload(files.signature, 'signature', 'candidate_documents')
      ]);

      const fullAddress = `${formData.addressLine ? formData.addressLine + ', ' : ''}${formData.city}, ${formData.state}${formData.pincode ? ' - ' + formData.pincode : ''}`;
      const { error } = await supabase.from('profiles').update({
        full_name: formData.fullName,
        phone: formData.phone,
        address: fullAddress,
        profile_photo_url: photoUrl,
        aadhaar_front_url: frontUrl,
        aadhaar_back_url: backUrl,
        pan_card_url: panUrl,
        signature_url: signatureUrl,
        profile_completed: true
      }).eq('id', user.id);

      if (error) throw error;

      // Send administrative notification
      await sendEmailNotification({
        ...formData,
        email: user.email,
        photoUrl,
        frontUrl,
        backUrl,
        panUrl,
        signatureUrl
      });

      showAlert('Registration completed! Redirecting...', 'success');
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DisclaimerOverlay user={user} profile={profile} />
      <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={(file) => setFiles({...files, photo: file})} />

      {/* ── LOCATION PERMISSION MODAL ── */}
      <AnimatePresence>
        {locationError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
            >
              {/* Amber gradient top */}
              <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 px-8 pt-8 pb-6 text-center relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />
                <div className="w-16 h-16 bg-white/25 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <ShieldAlert className="w-9 h-9 text-white" />
                </div>
                <h2 className="text-white font-black text-lg leading-tight">
                  {locationError === 'denied' ? 'Location Access Blocked' : 'Location Unavailable'}
                </h2>
                <p className="text-white/75 text-xs mt-1 font-medium">
                  {locationError === 'denied'
                    ? 'This browser has blocked location for this site.'
                    : 'Could not reach your GPS. Check device settings.'}
                </p>
              </div>

              {/* Steps */}
              <div className="px-7 py-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-4">
                  {locationError === 'denied' ? 'How to allow it in browser' : 'How to fix it'}
                </p>
                <div className="space-y-3 mb-6">
                  {(locationError === 'denied' ? [
                    { icon: '🔒', text: 'Click the lock icon in your browser address bar' },
                    { icon: '📍', text: 'Set "Location" permission to Allow' },
                    { icon: '🔄', text: 'Reload this page and click Detect Location again' },
                  ] : [
                    { icon: '⚙️', text: 'Open your device Settings' },
                    { icon: '📍', text: 'Go to Privacy → Location Services → turn On' },
                    { icon: '🔄', text: 'Come back and click Detect Location again' },
                  ]).map(({ icon, text }, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-base leading-none mt-0.5">{icon}</span>
                      <p className="text-sm text-slate-600 font-medium leading-snug">{text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setLocationError(null)}
                    className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    Fill Manually
                  </button>
                  <button
                    onClick={() => { setLocationError(null); window.location.reload(); }}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-95 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload & Retry
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="py-10 px-6 flex flex-col items-center justify-start bg-slate-50/50">

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card-saas max-w-2xl w-full p-8 md:p-14 my-10 relative z-10"
        >
          <header className="text-center mb-12 flex flex-col items-center">
            <div className="mb-4">
              <PMISLogo size={80} />
            </div>
            <h1 className="text-4xl font-outfit font-black text-slate-900 mb-2">Candidate Registration</h1>
            <p className="text-slate-500 font-medium">Complete your profile to access your assigned exams.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* MANDATORY LIVE PHOTO CAPTURE */}
            <div className="flex flex-col gap-3">
              {/* Row: label left — detect location button right */}
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Identity Verification (Live Photo) *</label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 border border-slate-200 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
                >
                  <MapPin className="w-3 h-3" />
                  {detectingLocation ? 'Detecting...' : 'Detect Location'}
                </button>
              </div>
              {/* Photo circle centered */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className={`w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center transition-all bg-white ${files.photo ? 'border-primary-500 shadow-2xl' : 'border-slate-100 shadow-inner'}`}>
                    {files.photo ? (
                      <img src={URL.createObjectURL(files.photo)} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Camera className="w-10 h-10 text-slate-300" />
                    )}
                    <button type="button" onClick={() => setIsCameraOpen(true)} className="absolute -bottom-2 right-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-primary-500 text-white shadow-xl hover:scale-110 transition-all">
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Name *</label>
                <input type="text" className="input-premium w-full" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Phone Number *</label>
                <div className="flex rounded-xl bg-white/40 border border-slate-200/50 backdrop-blur-sm focus-within:bg-white focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300 overflow-hidden">
                  <div className="flex items-center justify-center px-5 bg-slate-100/90 border-r border-slate-200/50 text-slate-800 font-black text-sm tracking-wider">
                    IN +91
                  </div>
                  <input 
                    type="tel" 
                    className="w-full bg-transparent px-5 py-4 outline-none text-slate-800 placeholder:text-slate-400 font-medium" 
                    placeholder="98765 43210" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">State / UT *</label>
                <SearchableDropdown value={formData.state} onChange={val => setFormData({...formData, state: val, city: ''})} options={Object.keys(indianStatesAndCities)} placeholder="Search State..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">City *</label>
                <SearchableDropdown value={formData.city} onChange={val => setFormData({...formData, city: val})} options={formData.state ? indianStatesAndCities[formData.state] : []} placeholder={formData.state ? "Select City..." : "Select State First"} disabled={!formData.state} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Residential Address *</label>
                <input 
                  type="text" 
                  className="input-premium w-full" 
                  placeholder="House No, Building, Street..." 
                  value={formData.addressLine} 
                  onChange={e => setFormData({...formData, addressLine: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">PIN Code *</label>
                <input 
                  type="text" 
                  className="input-premium w-full" 
                  placeholder="400001" 
                  maxLength={6}
                  value={formData.pincode} 
                  onChange={e => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '')})} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Identity Documents (Aadhaar & PAN) *</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Aadhaar Front */}
                 <div className="relative group h-[120px]">
                    <input type="file" accept="image/*" onChange={e => setFiles({...files, aadhaarFront: e.target.files[0]})} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="h-full flex flex-col justify-center border-2 border-dashed border-slate-200 rounded-[2rem] text-center group-hover:border-primary-500 transition-all bg-white shadow-sm p-4">
                       <ImageIcon className="mx-auto w-6 h-6 text-slate-400 mb-2" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase line-clamp-1">{files.aadhaarFront ? files.aadhaarFront.name : 'Aadhaar Front'}</span>
                    </div>
                 </div>
                 {/* Aadhaar Back */}
                 <div className="relative group h-[120px]">
                    <input type="file" accept="image/*" onChange={e => setFiles({...files, aadhaarBack: e.target.files[0]})} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="h-full flex flex-col justify-center border-2 border-dashed border-slate-200 rounded-[2rem] text-center group-hover:border-primary-500 transition-all bg-white shadow-sm p-4">
                       <ImageIcon className="mx-auto w-6 h-6 text-slate-400 mb-2" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase line-clamp-1">{files.aadhaarBack ? files.aadhaarBack.name : 'Aadhaar Back'}</span>
                    </div>
                 </div>
                 {/* PAN */}
                 <div className="relative group h-[120px]">
                    <input type="file" accept="image/*" onChange={e => setFiles({...files, panCard: e.target.files[0]})} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="h-full flex flex-col justify-center border-2 border-dashed border-slate-200 rounded-[2rem] text-center group-hover:border-primary-500 transition-all bg-white shadow-sm p-4">
                        <ImageIcon className="mx-auto w-6 h-6 text-slate-400 mb-2" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase line-clamp-1">{files.panCard ? files.panCard.name : 'Upload PAN Card'}</span>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Digital Signature *</label>
              <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 h-[280px]">
                <SignatureCanvas onCapture={(blob) => setFiles({ ...files, signature: blob })} />
              </div>
            </div>

            {/* Legal Acknowledgement */}
            <div className="space-y-6 pt-6 border-t border-slate-200/50">
               <h3 className="text-xl font-outfit font-black text-slate-900 tracking-tight">Legal Acknowledgement</h3>
               <div className="bg-slate-50/80 border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6 max-h-[300px] overflow-y-auto shadow-inner">
                 <div className="space-y-2">
                   <h4 className="text-sm font-bold text-slate-900">1. Identity Verification and Authentication</h4>
                   <p className="text-xs text-slate-600 leading-relaxed font-medium">
                     To ensure the integrity of the examination process and to prevent proxy attendance, the Candidate hereby authorizes the Portal to capture a live photograph (selfie) at the commencement of and/or during the examination. This image will be used solely to authenticate the Candidate's identity against registered records. Failure to provide a clear image or any attempt to bypass this authentication may result in immediate disqualification.
                   </p>
                 </div>
                 <div className="space-y-2">
                   <h4 className="text-sm font-bold text-slate-900">2. Purpose of Certification and Employment Disclaimer</h4>
                   <p className="text-xs text-slate-600 leading-relaxed font-medium mb-2">
                     The Candidate acknowledges and agrees that this certification is intended solely for personal and professional growth.
                   </p>
                   <ul className="list-disc pl-5 text-xs text-slate-600 space-y-2 font-medium">
                     <li><strong>No Guarantee of Employment:</strong> Successful completion of the exam and issuance of a certificate does not guarantee a job offer, placement, or any form of employment.</li>
                     <li><strong>No Guarantee of Financial Increase:</strong> This certification does not entitle the Candidate to a salary hike, promotion, or bonus from any current or future employer.</li>
                   </ul>
                   <p className="text-xs text-slate-600 leading-relaxed font-medium mt-2">
                     The Portal and its affiliates are not liable for any career expectations not met following the attainment of this certification.
                   </p>
                 </div>
                 <div className="space-y-2">
                   <h4 className="text-sm font-bold text-slate-900">3. Academic Integrity</h4>
                   <p className="text-xs text-slate-600 leading-relaxed font-medium">
                     The Candidate agrees to complete the examination independently without the use of unauthorized materials, AI tools, or external assistance. Any detected malpractice will lead to the permanent banning of the Candidate's profile and the nullification of any previous results.
                   </p>
                 </div>
                 <div className="space-y-2">
                   <h4 className="text-sm font-bold text-slate-900">4. Limitation of Liability</h4>
                   <p className="text-xs text-slate-600 leading-relaxed font-medium">
                     The Portal shall not be held responsible for technical failures on the Candidate's end, including but not limited to internet connectivity issues, hardware malfunctions, or power outages during the examination session.
                   </p>
                 </div>
               </div>
               
               <label className="flex items-start gap-4 cursor-pointer group mt-4 bg-white p-4 rounded-2xl border border-slate-100 hover:border-primary-500/30 transition-all shadow-sm">
                  <div className="relative mt-0.5 shrink-0">
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={isLegalAccepted}
                      onChange={() => setIsLegalAccepted(!isLegalAccepted)}
                    />
                    <div className="w-6 h-6 border-2 border-slate-200 rounded-lg group-hover:border-primary-500 transition-all peer-checked:bg-primary-500 peer-checked:border-primary-500" />
                    <CheckCircle className="absolute inset-0 w-6 h-6 text-white scale-0 peer-checked:scale-100 transition-transform" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors leading-relaxed">
                    I have read, understood, and agree to follow all the legal terms and academic integrity policies mentioned above.
                  </span>
               </label>
            </div>

            <AnimatePresence>
              {isLegalAccepted && (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  type="submit" 
                  disabled={loading} 
                  className="w-full btn-premium !py-5 !text-lg !rounded-2xl shadow-2xl flex items-center justify-center gap-3 overflow-hidden"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Complete Registration <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                </motion.button>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default CompleteProfile;
