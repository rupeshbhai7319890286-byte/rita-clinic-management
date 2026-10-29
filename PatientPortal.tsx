import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Home,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Search,
  Activity,
  FileText,
  Receipt,
  LogOut,
  Key,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  ShieldCheck,
  Printer,
  Download,
  Share2,
} from 'lucide-react';
import { PatientRecord, PatientUser, RequestItem, SaleBill } from '../types';
import {
  CLINIC_CONFIG,
  openWhatsAppChat,
  getPatientUsers,
  savePatientUsers,
  getLoggedInPatient,
  setLoggedInPatient,
  getDoctorPhoto,
} from '../utils/storage';
import { playClinicChime } from '../utils/sound';
import { sendBillToCustomerWhatsApp, downloadBillPdf } from '../utils/billPdfGenerator';

interface PatientPortalProps {
  requests: RequestItem[];
  onSubmitRequest: (req: Omit<RequestItem, 'id' | 'tokenNo' | 'status' | 'createdAt'>) => void;
  patients: PatientRecord[];
  sales: SaleBill[];
  onOpenRxPrint: (pt: PatientRecord) => void;
  onOpenBillPrint: (bill: SaleBill) => void;
  onOpenAiAssistant?: () => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  requests,
  onSubmitRequest,
  patients,
  sales,
  onOpenRxPrint,
  onOpenBillPrint,
  onOpenAiAssistant,
}) => {
  // Current logged in patient user state
  const [currentUser, setCurrentUser] = useState<PatientUser | null>(() => getLoggedInPatient());

  // Auth form states (when logged out)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regGender, setRegGender] = useState('पुरुष');
  const [regAddress, setRegAddress] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Active Tab when logged in: 'apt' | 'visit' | 'call' | 'status' | 'rx' | 'bills'
  const [activeTab, setActiveTab] = useState<'apt' | 'visit' | 'call' | 'status' | 'rx' | 'bills'>('apt');

  // Appointment Form state
  const [aptDate, setAptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [aptTime, setAptTime] = useState('सुबह 10:00 - 12:00');
  const [aptSymptoms, setAptSymptoms] = useState('');
  const [aptEmergency, setAptEmergency] = useState(false);

  // Home Visit Form state
  const [hvAddress, setHvAddress] = useState('');
  const [hvReason, setHvReason] = useState('');

  // Callback Form state
  const [cbReason, setCbReason] = useState('');

  // Alerts
  const [submittedAlert, setSubmittedAlert] = useState<string | null>(null);

  // Update default address when user changes
  useEffect(() => {
    if (currentUser?.address) {
      setHvAddress(currentUser.address);
    }
  }, [currentUser]);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanPhone = loginPhone.trim().replace(/[^0-9]/g, '');
    const enteredPass = loginPassword.trim();

    if (!cleanPhone || !enteredPass) {
      setAuthError('कृपया अपना 10 अंकों का मोबाइल नंबर और पासवर्ड दर्ज करें।');
      return;
    }

    const allUsers = getPatientUsers();
    const userFound = allUsers.find(
      (u) => (u.phone.trim() === cleanPhone || u.phone.includes(cleanPhone)) && u.password === enteredPass
    );

    if (userFound) {
      setLoggedInPatient(userFound);
      setCurrentUser(userFound);
      playClinicChime('success');
      setAuthError('');
      setSubmittedAlert(`स्वागत है ${userFound.name} जी! आप रीता क्लिनिक मरीज पोर्टल में सफलतापूर्वक लॉगिन हो गए हैं।`);
    } else {
      playClinicChime('alert');
      setAuthError('मोबाइल नंबर या पासवर्ड गलत है! यदि आपने खाता नहीं बनाया है तो "नया खाता बनाएं" पर क्लिक करें।');
    }
  };

  // Demo 1-Click Login for immediate testing
  const handleDemoLogin = (phone: string, pass: string) => {
    setLoginPhone(phone);
    setLoginPassword(pass);
    const allUsers = getPatientUsers();
    const userFound = allUsers.find((u) => u.phone === phone);
    if (userFound) {
      setLoggedInPatient(userFound);
      setCurrentUser(userFound);
      playClinicChime('success');
      setAuthError('');
      setSubmittedAlert(`स्वागत है ${userFound.name} जी! आप रीता क्लिनिक मरीज पोर्टल में लॉगिन हो गए हैं।`);
    }
  };

  // Handle Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const name = regName.trim();
    const cleanPhone = regPhone.trim().replace(/[^0-9]/g, '');
    const pass = regPassword.trim();

    if (!name || !cleanPhone || !pass) {
      setAuthError('कृपया मरीज का नाम, 10 अंकों का मोबाइल नंबर और पासवर्ड जरूर भरें!');
      return;
    }

    if (cleanPhone.length < 10) {
      setAuthError('कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें!');
      return;
    }

    const allUsers = getPatientUsers();
    const existing = allUsers.find((u) => u.phone.replace(/[^0-9]/g, '') === cleanPhone);

    if (existing) {
      setAuthError(`इस मोबाइल नंबर (${cleanPhone}) पर पहले से मरीज खाता मौजूद है! कृपया लॉगिन करें।`);
      setAuthMode('login');
      setLoginPhone(cleanPhone);
      return;
    }

    const newUser: PatientUser = {
      id: `pt_${Date.now()}`,
      name,
      phone: cleanPhone,
      password: pass,
      age: regAge.trim() ? `${regAge.trim()} वर्ष` : undefined,
      gender: regGender,
      address: regAddress.trim() || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const updatedUsers = [newUser, ...allUsers];
    savePatientUsers(updatedUsers);
    setLoggedInPatient(newUser);
    setCurrentUser(newUser);

    playClinicChime('success');
    setSubmittedAlert(`बधाई हो ${name} जी! आपका नया मरीज खाता बन गया है और आप लॉगिन हो चुके हैं।`);
  };

  // Handle Logout
  const handleLogout = () => {
    if (confirm('क्या आप अपने मरीज खाते से बाहर (Logout) आना चाहते हैं?')) {
      setLoggedInPatient(null);
      setCurrentUser(null);
      setSubmittedAlert(null);
      setAuthMode('login');
    }
  };

  // Appointment Submission
  const handleAptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!aptSymptoms.trim()) {
      alert('कृपया अपनी मुख्य बीमारी या समस्या का विवरण लिखें!');
      return;
    }

    onSubmitRequest({
      type: 'अपॉइंटमेंट',
      name: currentUser.name,
      phone: currentUser.phone,
      age: currentUser.age,
      gender: currentUser.gender,
      date: aptDate,
      timeSlot: aptTime,
      info: aptSymptoms.trim(),
      isEmergency: aptEmergency,
    });

    playClinicChime(aptEmergency ? 'alert' : 'notification');
    setSubmittedAlert(`धन्यवाद ${currentUser.name} जी! आपका परामर्श अपॉइंटमेंट डॉ. रूपेश कुमार पोद्दार जी के पास पहुँच गया है।`);
    setAptSymptoms('');
    setActiveTab('status');
  };

  // Home Visit Submission
  const handleHomeVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!hvAddress.trim()) {
      alert('कृपया घर का पूरा पता व लैंडमार्क दर्ज करें!');
      return;
    }

    onSubmitRequest({
      type: 'होम विजिट',
      name: currentUser.name,
      phone: currentUser.phone,
      age: currentUser.age,
      date: 'आज/शीघ्र',
      address: hvAddress.trim(),
      info: hvReason.trim() || 'घर पर चिकित्सीय परामर्श व स्वास्थ्य जांच',
      isEmergency: true,
    });

    playClinicChime('alert');
    setSubmittedAlert(`धन्यवाद ${currentUser.name} जी! आपके घर पर डॉक्टर विजिट का अनुरोध दर्ज हो गया है।`);
    setHvReason('');
    setActiveTab('status');
  };

  // Callback Submission
  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    onSubmitRequest({
      type: 'कॉल बैक',
      name: currentUser.name,
      phone: currentUser.phone,
      date: 'आज',
      info: cbReason.trim() || 'सामान्य सलाह व रिपोर्ट चर्चा',
      isEmergency: false,
    });

    playClinicChime('notification');
    setSubmittedAlert(`धन्यवाद ${currentUser.name} जी! आपका कॉल-बैक अनुरोध दर्ज हो गया है।`);
    setCbReason('');
    setActiveTab('status');
  };

  // ==========================================
  // VIEW 1: NOT LOGGED IN -> LOGIN / REGISTER
  // ==========================================
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-4 px-2 space-y-4">
        {/* Clinic Greeting Card */}
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-full border-2 border-amber-300 shadow-lg overflow-hidden bg-white">
            <img
              src={getDoctorPhoto()}
              alt={CLINIC_CONFIG.doctorName}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-lg font-black text-white">{CLINIC_CONFIG.name}</h2>
          <p className="text-xs text-blue-200">
            {CLINIC_CONFIG.doctorName} ({CLINIC_CONFIG.degrees})
          </p>
          <div className="pt-1">
            <span className="inline-block bg-blue-500/30 text-blue-200 text-[11px] px-3 py-1 rounded-full border border-blue-400/30">
              🔒 सुरक्षित मरीज पोर्टल (Private Patient Login)
            </span>
          </div>
          <p className="text-[11px] text-slate-300 pt-1 leading-relaxed">
            प्रत्येक मरीज की गोपनीयता हेतु आपका अपना अलग खाता है। कृपया अपना मोबाइल नंबर और पासवर्ड डालकर लॉगिन करें।
          </p>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-xs">
          <button
            onClick={() => {
              setAuthMode('login');
              setAuthError('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>🔐 मरीज लॉगिन (Login)</span>
          </button>
          <button
            onClick={() => {
              setAuthMode('register');
              setAuthError('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>📝 नया खाता बनाएं (Sign Up)</span>
          </button>
        </div>

        {/* Error / Success message */}
        {authError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="font-semibold">{authError}</p>
          </div>
        )}

        {authSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-semibold">{authSuccess}</p>
          </div>
        )}

        {/* LOGIN FORM */}
        {authMode === 'login' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="text-center pb-1">
              <h3 className="font-bold text-slate-800 text-sm">अपने मरीज खाते में प्रवेश करें</h3>
              <p className="text-[11px] text-slate-500">अपना मोबाइल नंबर व पासवर्ड दर्ज करें</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  मोबाइल नंबर (Patient ID) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="उदा. 9876543210"
                    maxLength={10}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">पासवर्ड (Password) *</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="अपना पासवर्ड डालें..."
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>मरीज लॉगिन करें (Sign In)</span>
              </button>
            </form>

            {/* Quick Demo Login Option for testing */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
                — टेस्ट मरीज खाता (Quick Demo Login) —
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('9876543210', '123')}
                  className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition-all"
                >
                  <p className="font-bold text-blue-900 text-[11px]">राम प्रवेश सिंह</p>
                  <p className="text-[10px] text-blue-600">ID: 9876543210</p>
                  <p className="text-[9px] text-slate-500">पासवर्ड: 123</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('9123456780', '123')}
                  className="p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-left transition-all"
                >
                  <p className="font-bold text-purple-900 text-[11px]">कांति देवी</p>
                  <p className="text-[10px] text-purple-600">ID: 9123456780</p>
                  <p className="text-[9px] text-slate-500">पासवर्ड: 123</p>
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold"
              >
                नया मरीज हैं? यहाँ क्लिक करके नया खाता बनाएं →
              </button>
            </div>
          </div>
        )}

        {/* REGISTRATION FORM */}
        {authMode === 'register' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="text-center pb-1">
              <h3 className="font-bold text-slate-800 text-sm">नया मरीज खाता बनाएं</h3>
              <p className="text-[11px] text-slate-500">अपना नाम, मोबाइल और पासवर्ड दर्ज करें</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">मरीज का पूरा नाम *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="उदा. अमित कुमार"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  मोबाइल नंबर (यह आपकी Login ID होगी) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="उदा. 9876543210 (10 अंक)"
                    maxLength={10}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">पासवर्ड बनाएं *</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="सरल पासवर्ड बनाएं (उदा. 12345)"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">उम्र (Age)</label>
                  <input
                    type="text"
                    value={regAge}
                    onChange={(e) => setRegAge(e.target.value)}
                    placeholder="उदा. 35"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">लिंग (Gender)</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white outline-none"
                  >
                    <option value="पुरुष">पुरुष (Male)</option>
                    <option value="महिला">महिला (Female)</option>
                    <option value="अन्य">अन्य (Other)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">घर का पता (Address)</label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="साइकिल चौक, मोहनपुर, मुजफ्फरपुर..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>खाता बनाएं और प्रवेश करें (Register & Log In)</span>
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold"
              >
                पहले से खाता है? यहाँ क्लिक करके लॉगिन करें →
              </button>
            </div>
          </div>
        )}

        {/* Doctor Contact Footer */}
        <div className="bg-slate-100 rounded-xl p-3 text-center text-xs text-slate-600">
          <p>
            मदद या आपातकालीन स्थिति में डॉक्टर साहब से संपर्क करें:
          </p>
          <div className="flex justify-center gap-3 mt-1.5 font-bold">
            <a href={`tel:${CLINIC_CONFIG.phone}`} className="text-emerald-700 hover:underline">
              📞 {CLINIC_CONFIG.phone}
            </a>
            <span>•</span>
            <a href="tel:112" className="text-red-600 hover:underline">
              🚨 112 एम्बुलेंस
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // VIEW 2: LOGGED IN PATIENT (DATA STRICTLY ISOLATED TO THIS USER)
  // ==============================================================
  const userPhone = currentUser.phone.replace(/[^0-9]/g, '');

  // Filter requests strictly for this patient's phone
  const myRequests = requests.filter((r) => {
    const rPhone = r.phone.replace(/[^0-9]/g, '');
    return rPhone === userPhone || rPhone.endsWith(userPhone) || userPhone.endsWith(rPhone);
  });

  // Filter prescriptions strictly for this patient's phone
  const myPrescriptions = patients.filter((p) => {
    const pPhone = p.phone.replace(/[^0-9]/g, '');
    return (
      (pPhone && (pPhone === userPhone || pPhone.endsWith(userPhone) || userPhone.endsWith(pPhone))) ||
      p.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
    );
  });

  // Filter bills strictly for this patient's phone
  const myBills = sales.filter((s) => {
    const sPhone = s.phone.replace(/[^0-9]/g, '');
    return (
      (sPhone && (sPhone === userPhone || sPhone.endsWith(userPhone) || userPhone.endsWith(sPhone))) ||
      s.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* 1. Patient Welcome & Account Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-xl shrink-0">
            👤
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white">
                नमस्ते, {currentUser.name} जी!
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                ✓ आपका व्यक्तिगत खाता
              </span>
            </div>
            <p className="text-[11px] text-blue-200 mt-0.5">
              📱 ID: <strong>{currentUser.phone}</strong> {currentUser.age ? `• उम्र: ${currentUser.age}` : ''} {currentUser.gender ? `• ${currentUser.gender}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-red-200 text-xs font-bold border border-white/20 transition-colors"
            title="मरीज खाता बंद करें"
          >
            <LogOut className="w-3.5 h-3.5 text-red-300" />
            <span>लॉगआउट</span>
          </button>
        </div>
      </div>

      {/* Alert Banner if submitted */}
      {submittedAlert && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs font-semibold text-emerald-900">{submittedAlert}</p>
          </div>
          <button
            onClick={() => setSubmittedAlert(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-1 flex overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('apt')}
          className={`flex-1 min-w-[120px] py-2.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'apt'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>📅 अपॉइंटमेंट बुक</span>
        </button>

        <button
          onClick={() => setActiveTab('visit')}
          className={`flex-1 min-w-[110px] py-2.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'visit'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>🏠 होम विजिट</span>
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 min-w-[120px] py-2.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
            activeTab === 'status'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>📋 मेरे आवेदन</span>
          {myRequests.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-900 text-[10px] font-bold rounded-full">
              {myRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rx')}
          className={`flex-1 min-w-[130px] py-2.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
            activeTab === 'rx'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>🩺 मेरे डॉक्टर पर्चे</span>
          {myPrescriptions.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-full">
              {myPrescriptions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`flex-1 min-w-[120px] py-2.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
            activeTab === 'bills'
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>🧾 मेरे दवा बिल</span>
          {myBills.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full">
              {myBills.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('call')}
          className={`flex-1 min-w-[110px] py-2.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'call'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>📞 कॉल-बैक</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column (8 cols) */}
        <div className="md:col-span-8 space-y-4">
          {/* TAB 1: BOOK APPOINTMENT */}
          {activeTab === 'apt' && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  क्लिनिक परामर्श
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  📅 डॉक्टर परामर्श हेतु अपॉइंटमेंट लें
                </h3>
                <p className="text-xs text-slate-500">
                  क्लिनिक आने से पहले अपना टोकन व समय आरक्षित करें ताकि भीड़ में इंतजार न करना पड़े।
                </p>
              </div>

              {/* Pre-filled Patient Details Info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="text-slate-500 text-[11px]">मरीज का नाम व आईडी:</p>
                  <p className="font-bold text-slate-900">
                    {currentUser.name} • {currentUser.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-[11px]">उम्र व लिंग:</p>
                  <p className="font-semibold text-slate-700">
                    {currentUser.age || 'उम्र दर्ज नहीं'} ({currentUser.gender || 'पुरुष'})
                  </p>
                </div>
              </div>

              <form onSubmit={handleAptSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">परामर्श की तारीख *</label>
                    <input
                      type="date"
                      required
                      value={aptDate}
                      onChange={(e) => setAptDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">सुविधाजनक समय स्लॉट</label>
                    <select
                      value={aptTime}
                      onChange={(e) => setAptTime(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium"
                    >
                      <option value="सुबह 08:30 - 10:00">सुबह 08:30 - 10:00</option>
                      <option value="सुबह 10:00 - 12:00">सुबह 10:00 - 12:00</option>
                      <option value="दोपहर 12:00 - 02:00">दोपहर 12:00 - 02:00</option>
                      <option value="शाम 04:00 - 06:30">शाम 04:00 - 06:30</option>
                      <option value="शाम 06:30 - 09:00">शाम 06:30 - 09:00</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    बीमारी / लक्षण / मुख्य परेशानी का विवरण *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={aptSymptoms}
                    onChange={(e) => setAptSymptoms(e.target.value)}
                    placeholder="उदा. 2 दिन से तेज बुखार, खांसी, सीने में जकड़न, घबराहट या पेट दर्द..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <input
                    type="checkbox"
                    id="patientEmergencyCheck"
                    checked={aptEmergency}
                    onChange={(e) => setAptEmergency(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <label htmlFor="patientEmergencyCheck" className="text-xs text-amber-900 font-semibold cursor-pointer">
                    🚨 यह गंभीर स्थिति / इमरजेंसी है (प्राथमिकता के साथ परामर्श चाहिए)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>अपॉइंटमेंट टोकन बुक करें (Book Appointment)</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: HOME VISIT */}
          {activeTab === 'visit' && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                  घर पर चिकित्सीय सेवा
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  🏠 डॉक्टर साहब को घर बुलाएं (Home Visit)
                </h3>
                <p className="text-xs text-slate-500">
                  बुजुर्ग, गंभीर अथवा चलने में असमर्थ मरीजों के लिए साइकिल चौक, मोहनपुर व आसपास डॉक्टर विजिट सुविधा।
                </p>
              </div>

              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="text-purple-600 text-[11px]">मरीज का नाम व फोन:</p>
                  <p className="font-bold text-slate-900">
                    {currentUser.name} • {currentUser.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-purple-600 text-[11px]">उम्र:</p>
                  <p className="font-semibold text-slate-700">{currentUser.age || 'दर्ज नहीं'}</p>
                </div>
              </div>

              <form onSubmit={handleHomeVisitSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    घर का पूरा पता व लैंडमार्क (मोहनपुर क्षेत्र) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={hvAddress}
                    onChange={(e) => setHvAddress(e.target.value)}
                    placeholder="गली नं., मकान संख्या, साइकिल चौक के पास या कोई मुख्य पहचान..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    मुख्य परेशानी / कारण (Problem Description)
                  </label>
                  <input
                    type="text"
                    value={hvReason}
                    onChange={(e) => setHvReason(e.target.value)}
                    placeholder="उदा. बिस्तर से उठ नहीं पा रहे, तेज दर्द, बीपी व ड्रिप लगाना..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>होम विजिट का आवेदन भेजें (Request Home Visit)</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: MY REQUESTS (STRICTLY ISOLATED TO THIS PATIENT) */}
          {activeTab === 'status' && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    📋 आपके द्वारा भेजे गए आवेदन (Live Status)
                  </h3>
                  <p className="text-xs text-slate-500">
                    यहाँ केवल आपके द्वारा दर्ज किए गए अपॉइंटमेंट व टोकन स्थिति दिखाई दे रही है।
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-800 font-bold text-xs rounded-lg border border-blue-200">
                  कुल आवेदन: {myRequests.length}
                </span>
              </div>

              {/* Status List */}
              <div className="space-y-3">
                {myRequests.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full font-black text-[11px] bg-blue-600 text-white">
                            टोकन #{item.tokenNo}
                          </span>
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-200 text-slate-800">
                            {item.type}
                          </span>
                          {item.isEmergency && (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-red-100 text-red-700">
                              🚨 इमरजेंसी
                            </span>
                          )}
                        </div>

                        <p className="text-slate-800 font-medium mt-1">
                          <strong>समस्या:</strong> {item.info}
                        </p>
                        {item.address && (
                          <p className="text-slate-600">
                            <strong>पता:</strong> {item.address}
                          </p>
                        )}
                        <p className="text-slate-400 text-[11px]">
                          समय: {item.date} {item.timeSlot ? `(${item.timeSlot})` : ''} • भेजा गया: {item.createdAt}
                        </p>

                        {item.doctorNotes && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px]">
                            <strong>डॉक्टर टिप्पणी:</strong> {item.doctorNotes}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
                            item.status === 'स्वीकृत'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : item.status === 'लंबित'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : item.status === 'पूर्ण'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.status === 'स्वीकृत' && (
                          <div className="text-[10px] text-emerald-700 font-bold mt-1">
                            ✓ डॉक्टर साहब ने स्वीकार किया
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {myRequests.length === 0 && (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">
                      आपने अभी तक कोई अपॉइंटमेंट बुक नहीं किया है।
                    </p>
                    <button
                      onClick={() => setActiveTab('apt')}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors inline-block"
                    >
                      + नया अपॉइंटमेंट लें
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MY PRESCRIPTIONS (RX) (STRICTLY ISOLATED TO THIS PATIENT) */}
          {activeTab === 'rx' && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    🩺 मेरे डॉक्टर पर्चे (My Prescriptions / Rx)
                  </h3>
                  <p className="text-xs text-slate-500">
                    डॉ. रूपेश कुमार पोद्दार जी द्वारा आपके लिए जारी किए गए डिजिटल पर्चे व दवाइयां:
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200">
                  कुल पर्चे: {myPrescriptions.length}
                </span>
              </div>

              <div className="space-y-4">
                {myPrescriptions.map((pt) => (
                  <div
                    key={pt.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-emerald-300 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-bold">
                            OPD: {pt.opdNo}
                          </span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{pt.name}</span>
                          <span className="text-[11px] text-slate-500">
                            ({pt.age} / {pt.gender})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">तारीख: {pt.createdAt}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenRxPrint(pt)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          title="पर्चा देखें व प्रिंट/PDF डाउनलोड करें"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>📥 पर्चा देखें व प्रिंट</span>
                        </button>
                      </div>
                    </div>

                    {/* Vitals */}
                    {(pt.bp || pt.pulse || pt.temp || pt.weight) && (
                      <div className="flex flex-wrap gap-2 text-[11px] bg-white p-2 rounded-xl border border-slate-200">
                        {pt.bp && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                            <strong>BP:</strong> {pt.bp}
                          </span>
                        )}
                        {pt.pulse && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                            <strong>Pulse:</strong> {pt.pulse}
                          </span>
                        )}
                        {pt.temp && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                            <strong>Temp:</strong> {pt.temp}
                          </span>
                        )}
                        {pt.weight && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                            <strong>Weight:</strong> {pt.weight}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Symptoms & Diagnosis */}
                    <div className="text-xs space-y-1 bg-white p-2.5 rounded-xl border border-slate-200">
                      <p className="text-slate-700">
                        <strong>लक्षण (Symptoms):</strong> {pt.symptoms}
                      </p>
                      <p className="text-emerald-800 font-semibold">
                        <strong>निदान (Diagnosis):</strong> {pt.diagnosis}
                      </p>
                    </div>

                    {/* Medicines List */}
                    <div className="space-y-1.5 text-xs">
                      <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                        💊 डॉक्टर द्वारा लिखी गई दवाएं (Medicines):
                      </p>
                      <div className="space-y-1">
                        {pt.medicines.map((m, idx) => (
                          <div
                            key={m.id || idx}
                            className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200"
                          >
                            <span className="font-bold text-slate-900">{m.name}</span>
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-semibold rounded">
                                {m.dosage}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                                {m.timing}
                              </span>
                              <span className="font-bold text-slate-600">{m.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Instructions & Next Visit */}
                    {(pt.instructions || pt.nextVisit) && (
                      <div className="text-xs p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                        {pt.instructions && (
                          <p className="text-amber-900">
                            <strong>सलाह व परहेज:</strong> {pt.instructions}
                          </p>
                        )}
                        {pt.nextVisit && (
                          <p className="text-amber-900 font-semibold">
                            <strong>अगली मुलाकात:</strong> {pt.nextVisit}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {myPrescriptions.length === 0 && (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">
                      डॉक्टर साहब द्वारा अभी तक आपका कोई डिजिटल पर्चा नहीं बना है।
                    </p>
                    <p className="text-[11px] text-slate-400">
                      जब आप क्लिनिक में परामर्श लेंगे, आपका पर्चा यहाँ स्वतः सुरक्षित हो जाएगा।
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: MY BILLS (STRICTLY ISOLATED TO THIS PATIENT) */}
          {activeTab === 'bills' && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    🧾 मेरे दवा बिल व रसीदें (My Bills & Receipts)
                  </h3>
                  <p className="text-xs text-slate-500">
                    रीता क्लिनिक से खरीदी गई दवाओं का बिल और भुगतान रसीद:
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-lg border border-amber-200">
                  कुल बिल: {myBills.length}
                </span>
              </div>

              <div className="space-y-4">
                {myBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-amber-300 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-600 text-white rounded-md text-[10px] font-bold">
                            {bill.billNo}
                          </span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{bill.name}</span>
                          <span className="text-[11px] text-slate-500">• तारीख: {bill.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => downloadBillPdf(bill)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          title="बिल PDF सीधे डाउनलोड करें"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>📥 PDF</span>
                        </button>

                        <button
                          onClick={() => sendBillToCustomerWhatsApp(bill)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          title="WhatsApp पर रसीद व PDF भेजें"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>📲 WhatsApp</span>
                        </button>

                        <button
                          onClick={() => onOpenBillPrint(bill)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          title="बिल देखें व रसीद प्रिंट करें"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>प्रिंट</span>
                        </button>
                      </div>
                    </div>

                    {/* Items table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                          <tr>
                            <th className="p-2">दवा का नाम</th>
                            <th className="p-2 text-center">मात्रा</th>
                            <th className="p-2 text-right">दर</th>
                            <th className="p-2 text-right">कुल</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bill.items.map((item, idx) => (
                            <tr key={item.id || idx}>
                              <td className="p-2 font-medium text-slate-800">{item.name}</td>
                              <td className="p-2 text-center text-slate-600">{item.qty}</td>
                              <td className="p-2 text-right text-slate-600">₹{item.price}</td>
                              <td className="p-2 text-right font-bold text-slate-900">
                                ₹{item.qty * item.price}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary row */}
                    <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          भुगतान माध्यम: {bill.paymentMode}
                        </span>
                        {bill.balance > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                            बकाया: ₹{bill.balance}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ पूरा भुगतान
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-slate-500 text-[11px]">कुल भुगतान राशि:</p>
                        <p className="font-black text-slate-900 text-sm">₹{bill.total}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {myBills.length === 0 && (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">
                      आपका कोई दवा बिल उपलब्ध नहीं है।
                    </p>
                    <p className="text-[11px] text-slate-400">
                      जब आप क्लिनिक से दवा खरीदेंगे, उसका बिल यहाँ तुरंत दिखेगा।
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: TELEPHONIC CALLBACK */}
          {activeTab === 'call' && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full">
                  फ्री टेलीफोनिक सलाह
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  📞 क्लिनिक से तुरंत कॉल प्राप्त करें
                </h3>
                <p className="text-xs text-slate-500">
                  अगर कोई रिपोर्ट दिखानी हो या कोई सवाल हो, तो अनुरोध भेजें। डॉ. रूपेश कुमार पोद्दार जी आपको कॉल करेंगे।
                </p>
              </div>

              <div className="p-3 bg-cyan-50/60 border border-cyan-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="text-cyan-600 text-[11px]">कॉल प्राप्त करने हेतु नंबर:</p>
                  <p className="font-bold text-slate-900">
                    {currentUser.name} • {currentUser.phone}
                  </p>
                </div>
              </div>

              <form onSubmit={handleCallbackSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    बातचीत का मुख्य विषय / कारण
                  </label>
                  <input
                    type="text"
                    required
                    value={cbReason}
                    onChange={(e) => setCbReason(e.target.value)}
                    placeholder="उदा. कल दी गई दवाई की खुराक या ब्लड टेस्ट रिपोर्ट के बारे में"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>कॉल-बैक का अनुरोध भेजें (Request Callback)</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column (4 cols on desktop) */}
        <div className="md:col-span-4 space-y-3">
          {/* Doctor Card */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={getDoctorPhoto()}
                alt={CLINIC_CONFIG.doctorName}
                className="w-13 h-13 rounded-full border-2 border-amber-300 shadow-md object-cover bg-white shrink-0"
              />
              <div>
                <h4 className="font-bold text-sm text-white">{CLINIC_CONFIG.doctorName}</h4>
                <p className="text-[11px] text-blue-200">{CLINIC_CONFIG.degrees}</p>
                <p className="text-[10px] text-emerald-300 font-semibold mt-0.5">● क्लिनिक खुला है</p>
              </div>
            </div>

            <div className="text-[11px] text-slate-200 space-y-1.5 pt-2 border-t border-white/10">
              <p className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-300 shrink-0 mt-0.5" />
                <span>{CLINIC_CONFIG.address}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span>{CLINIC_CONFIG.openingHours}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${CLINIC_CONFIG.phone}`}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>सीधी कॉल</span>
              </a>

              <button
                onClick={() =>
                  openWhatsAppChat(
                    CLINIC_CONFIG.phone,
                    `नमस्ते डॉ. रूपेश कुमार पोद्दार जी, मैं मरीज ${currentUser.name} (${currentUser.phone}) बोल रहा हूँ। मुझे परामर्श की आवश्यकता है।`
                  )
                }
                className="py-2 px-3 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1 shadow-xs"
              >
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Privacy & Account Shield Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>व्यक्तिगत व सुरक्षित रिकॉर्ड्स</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              इस पोर्टल में आपके पर्चे, दवाइयां और बिल पूरी तरह केवल आपके मोबाइल ID ({currentUser.phone}) से सुरक्षित हैं। कोई दूसरा मरीज आपकी रिपोर्ट नहीं देख सकता।
            </p>
          </div>

          {/* Emergency Alert Card */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-red-800 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>आपातकालीन चिकित्सा (Emergency)</span>
            </div>
            <p className="text-red-700 text-[11px] leading-relaxed">
              गंभीर दुर्घटना, हृदय आघात या सांस लेने में भारी तकलीफ की स्थिति में तुरंत एम्बुलेंस सेवा को कॉल करें:
            </p>
            <a
              href="tel:112"
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <span>🚨 112 एम्बुलेंस सेवा</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
