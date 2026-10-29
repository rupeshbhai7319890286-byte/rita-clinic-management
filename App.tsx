/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Lock,
  User,
  Phone,
  AlertTriangle,
  HeartPulse,
  MapPin,
  Clock,
  Sparkles,
  QrCode,
  Download,
  Share2,
  Volume2,
  FileText,
  KeyRound,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PatientRecord, RequestItem, SaleBill, UdhaariRecord } from './types';
import {
  CLINIC_CONFIG,
  exportBackupJson,
  getStoredData,
  initializeClinicData,
  openWhatsAppChat,
  setStoredData,
} from './utils/storage';
import { initAuth } from './utils/firebaseAuth';
import { User as FirebaseUser } from 'firebase/auth';
import { playClinicChime } from './utils/sound';
import { PatientPortal } from './components/PatientPortal';
import { DoctorDashboard } from './components/DoctorDashboard';
import { PrescriptionPrintModal } from './components/PrescriptionPrintModal';
import { BillPrintModal } from './components/BillPrintModal';
import { UpiQrModal } from './components/UpiQrModal';
import { DesktopGuideModal } from './components/DesktopGuideModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { ShareAppModal } from './components/ShareAppModal';
import { AiDoctorAssistantModal } from './components/AiDoctorAssistantModal';
import { usePWAInstall } from './hooks/usePWAInstall';

export default function App() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isDoctorMode, setIsDoctorMode] = useState(false);

  // Doctor Admin Login with ID & Password (ID: 7319890286, Password: Rupmala@2005)
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminIdInput, setAdminIdInput] = useState('7319890286');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Google Drive Auth state (Token cached strictly in memory as per Workspace guidelines)
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Modals
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const [selectedRxPatient, setSelectedRxPatient] = useState<PatientRecord | null>(null);
  const [selectedBill, setSelectedBill] = useState<SaleBill | null>(null);
  const [qrModalState, setQrModalState] = useState<{ isOpen: boolean; amount: number; patientName?: string }>({
    isOpen: false,
    amount: 150,
  });

  // State
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [sales, setSales] = useState<SaleBill[]>([]);
  const [udhaari, setUdhaari] = useState<UdhaariRecord[]>([]);

  // Initialize
  useEffect(() => {
    initializeClinicData();
    setRequests(getStoredData<RequestItem[]>('rc_requests', []));
    setPatients(getStoredData<PatientRecord[]>('rc_doc_patients', []));
    setSales(getStoredData<SaleBill[]>('rc_doc_sales', []));
    setUdhaari(getStoredData<UdhaariRecord[]>('rc_doc_udhaari', []));

    // Listen to Auth State
    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Sync to localStorage
  const updateRequests = (newReqs: RequestItem[]) => {
    setRequests(newReqs);
    setStoredData('rc_requests', newReqs);
  };

  const updatePatients = (newPts: PatientRecord[]) => {
    setPatients(newPts);
    setStoredData('rc_doc_patients', newPts);
  };

  const updateSales = (newSales: SaleBill[]) => {
    setSales(newSales);
    setStoredData('rc_doc_sales', newSales);
  };

  const updateUdhaari = (newUdh: UdhaariRecord[]) => {
    setUdhaari(newUdh);
    setStoredData('rc_doc_udhaari', newUdh);
  };

  // Handlers for Request submission by Patient
  const handleCreateRequest = (reqData: Omit<RequestItem, 'id' | 'tokenNo' | 'status' | 'createdAt'>) => {
    const nextToken = requests.length > 0 ? Math.max(...requests.map((r) => r.tokenNo)) + 1 : 101;
    const newReq: RequestItem = {
      ...reqData,
      id: 'req_' + Date.now(),
      tokenNo: nextToken,
      status: 'लंबित',
      createdAt: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    updateRequests([newReq, ...requests]);
  };

  const handleUpdateRequestStatus = (id: string, status: RequestItem['status']) => {
    const updated = requests.map((r) => (r.id === id ? { ...r, status } : r));
    updateRequests(updated);
  };

  // Patient / Rx handlers
  const handleAddPatient = (patient: PatientRecord) => {
    updatePatients([patient, ...patients]);
    setSelectedRxPatient(patient); // Automatically preview newly created prescription with PDF download!
  };

  const handleDeletePatient = (id: string) => {
    updatePatients(patients.filter((p) => p.id !== id));
  };

  // Bill handlers
  const handleAddBill = (bill: SaleBill) => {
    updateSales([bill, ...sales]);
    setSelectedBill(bill); // Automatically preview newly created bill with PDF download!
  };

  // Udhaari handlers
  const handleAddUdhaari = (u: UdhaariRecord) => {
    updateUdhaari([u, ...udhaari]);
  };

  const handleSettleUdhaari = (id: string, amount: number) => {
    const updated = udhaari.map((u) => {
      if (u.id === id) {
        const newBal = Math.max(0, u.balance - amount);
        const newHistory = [
          {
            date: new Date().toLocaleDateString('hi-IN'),
            amount,
            mode: 'नकद/UPI जमा',
            note: 'खाता भुगतान प्राप्त हुआ',
          },
          ...u.history,
        ];
        return {
          ...u,
          balance: newBal,
          totalReceived: u.totalReceived + amount,
          lastUpdated: new Date().toLocaleDateString('hi-IN'),
          history: newHistory,
        };
      }
      return u;
    });
    updateUdhaari(updated);
  };

  // Doctor Admin Login with ID: 7319890286 & Password: Rupmala@2005
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      adminIdInput.trim() === CLINIC_CONFIG.adminId &&
      adminPasswordInput === CLINIC_CONFIG.adminPassword
    ) {
      setIsDoctorMode(true);
      setShowLoginModal(false);
      setAdminPasswordInput('');
      setLoginError('');
      playClinicChime('success');
    } else {
      setLoginError('गलत डॉक्टर ID या पासवर्ड! कृपया सही विवरण दर्ज करें।');
      playClinicChime('alert');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      
      {/* 1. TOP PORTAL SWITCHER & DESKTOP BAR (no-print) */}
      <header className="no-print bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2 text-xs">
          
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-slate-200">
              {isDoctorMode ? (
                <span className="text-blue-300 font-bold flex items-center gap-1">
                  👨‍⚕️ डॉक्टर एडमिन मोड ({CLINIC_CONFIG.doctorName})
                </span>
              ) : (
                <span className="text-slate-300">👤 मरीज पोर्टल (Patient View)</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* AI Doctor & Rx Scanner Button */}
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-[11px] transition-all shadow-md animate-pulse border border-purple-300/40"
              title="AI डॉक्टर: पर्चे की फोटो भेजकर दवाइयां समझें व सलाह लें"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>🤖 AI डॉक्टर (Rx Scanner)</span>
            </button>

            {/* Share App to Patients / Others Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all shadow-sm"
              title="मरीज के फोन में ऐप डाउनलोड कराने के लिए QR कोड व WhatsApp शेयर करें"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-200" />
              <span>📲 दूसरों को ऐप भेजें</span>
            </button>

            {/* Direct PWA App Download/Install Button for current device */}
            {!isInstalled && (
              <button
                onClick={() => {
                  if (isInstallable) {
                    install();
                  } else {
                    setShowInstallModal(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] transition-all shadow-md animate-pulse"
                title="रीता क्लिनिक ऐप फोन या कंप्यूटर पर डाउनलोड करें"
              >
                <Download className="w-3.5 h-3.5" />
                <span>📲 ऐप डाउनलोड करें</span>
              </button>
            )}

            {/* Desktop Guide Button */}
            <button
              onClick={() => setShowDesktopGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] border border-amber-400/40 transition-colors shadow-xs"
              title="डेस्कटॉप पर ऐप कैसे चलाएं व इंस्टॉल करें"
            >
              <Monitor className="w-3.5 h-3.5 text-amber-400" />
              <span>🖥️ डेस्कटॉप गाइड</span>
            </button>

            {/* Portal Switch Button */}
            {isDoctorMode ? (
              <button
                onClick={() => setIsDoctorMode(false)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors flex items-center gap-1"
              >
                <User className="w-3.5 h-3.5" />
                <span>मरीज पोर्टल पर जाएं</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAdminPasswordInput('');
                  setLoginError('');
                  setShowLoginModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1 shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>🔐 डॉक्टर लॉगिन</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Quick Download / Install Sticky Banner */}
      {!isInstalled && (
        <div className="no-print bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 text-white px-3 py-2 text-xs shadow-md border-b border-emerald-500/30">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/clinic-logo.png"
                alt="Rita Clinic Logo"
                className="w-6 h-6 rounded-full border border-amber-300 object-cover bg-white shrink-0"
              />
              <span className="font-semibold text-[11px] sm:text-xs">
                <strong>रीता क्लिनिक Android APK / ऐप:</strong> डॉ. रूपेश कुमार पोद्दार जी के लोगो वाली ऑफिशियल ऐप फोन पर इंस्टॉल करें।
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/RitaClinic.apk"
                download="RitaClinic.apk"
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-[11px] shadow-md transition-all flex items-center gap-1 cursor-pointer"
                title="सीधा RitaClinic.apk डाउनलोड करें (बिना किसी लिंक एरर के)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>📥 डाउनलोड APK</span>
              </a>

              <button
                onClick={() => {
                  if (isInstallable) {
                    install();
                  } else {
                    setShowInstallModal(true);
                  }
                }}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-[11px] shadow-md transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>📲 ऐप गाइड / इंस्टॉल</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CLINIC HEADER BANNER (no-print) */}
      <section className="no-print bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white py-4 px-3 sm:px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <img
              src="/clinic-logo.png"
              alt="Rita Clinic Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-amber-300 shadow-md object-cover bg-white shrink-0"
            />
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-1">
                <HeartPulse className="w-3.5 h-3.5 text-red-400" />
                <span>विश्वसनीय प्राथमिक स्वास्थ्य व 24 घंटे आपातकालीन सेवा</span>
              </div>
              
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                {CLINIC_CONFIG.name}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-amber-300">
                {CLINIC_CONFIG.doctorName} <span className="text-blue-200 font-normal">({CLINIC_CONFIG.degrees})</span>
              </p>
              <p className="text-[11px] text-blue-100 flex items-center justify-center md:justify-start gap-1 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{CLINIC_CONFIG.address}</span>
              </p>
            </div>
          </div>

          {/* Quick Contact Action Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <a
              href={`tel:${CLINIC_CONFIG.phone}`}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>📞 {CLINIC_CONFIG.phone}</span>
            </a>

            <a
              href={`tel:${CLINIC_CONFIG.emergencyPhone}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>🚨 112 एम्बुलेंस</span>
            </a>

            <button
              onClick={() => setQrModalState({ isOpen: true, amount: 150, patientName: 'क्लिनिक परामर्श' })}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-blue-200 font-semibold rounded-xl border border-blue-400/30 transition-colors"
              title="क्लिनिक UPI QR कोड देखें"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-300" />
              <span>UPI QR</span>
            </button>
          </div>

        </div>
      </section>

      {/* 3. MAIN WORKSPACE / VIEW */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-4 md:p-6">
        {isDoctorMode ? (
          <DoctorDashboard
            requests={requests}
            patients={patients}
            sales={sales}
            udhaari={udhaari}
            user={user}
            accessToken={accessToken}
            onAuthSuccess={(u, token) => {
              setUser(u);
              setAccessToken(token);
            }}
            onLogout={() => {
              setUser(null);
              setAccessToken(null);
            }}
            onUpdateRequestStatus={handleUpdateRequestStatus}
            onAddPatient={handleAddPatient}
            onDeletePatient={handleDeletePatient}
            onAddBill={handleAddBill}
            onAddUdhaari={handleAddUdhaari}
            onSettleUdhaari={handleSettleUdhaari}
            onOpenRxPrint={(pt) => setSelectedRxPatient(pt)}
            onOpenBillPrint={(bill) => setSelectedBill(bill)}
            onOpenQrModal={(amt, name) => setQrModalState({ isOpen: true, amount: amt, patientName: name })}
            onOpenDesktopGuide={() => setShowDesktopGuide(true)}
            onExportBackup={exportBackupJson}
            onOpenShareApp={() => setShowShareModal(true)}
          />
        ) : (
          <PatientPortal
            requests={requests}
            onSubmitRequest={handleCreateRequest}
            patients={patients}
            sales={sales}
            onOpenRxPrint={(pt) => setSelectedRxPatient(pt)}
            onOpenBillPrint={(bill) => setSelectedBill(bill)}
            onOpenAiAssistant={() => setShowAiModal(true)}
          />
        )}
      </main>

      {/* 4. FOOTER (no-print) */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 space-y-1">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700">
            {CLINIC_CONFIG.name} • {CLINIC_CONFIG.doctorName} ({CLINIC_CONFIG.degrees})
          </p>
          <p className="text-slate-500">
            साइकिल चौक, मोहनपुर, मुजफ्फरपुर, बिहार – 843121 • मो: {CLINIC_CONFIG.phone}
          </p>
        </div>
      </footer>

      {/* ================= MODALS ================= */}

      {/* 1. Doctor ID & Password Authentication Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">👨‍⚕️ डॉक्टर एडमिन लॉगिन</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              रीता क्लिनिक — डॉ. रूपेश कुमार पोद्दार (मोहनपुर, मुजफ्फरपुर)
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-left text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                डॉक्टर ID / मोबाइल नंबर *
              </label>
              <input
                type="text"
                required
                value={adminIdInput}
                onChange={(e) => setAdminIdInput(e.target.value)}
                placeholder="7319890286"
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                गुप्त पासवर्ड *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="पासवर्ड दर्ज करें"
                  className="w-full py-2.5 pl-3 pr-10 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 font-semibold text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-700 p-2.5 rounded-xl text-xs font-semibold border border-red-200">
                ⚠️ {loginError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all"
              >
                लॉगिन करें (Login)
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* 2. Desktop & PC Guide Modal */}
    <DesktopGuideModal isOpen={showDesktopGuide} onClose={() => setShowDesktopGuide(false)} />

    {/* 3. Prescription Print & PDF Download Modal */}
    <PrescriptionPrintModal
      patient={selectedRxPatient}
      accessToken={accessToken}
      onClose={() => setSelectedRxPatient(null)}
    />

    {/* 4. Medicine Bill Print & PDF Download Modal */}
    <BillPrintModal
      bill={selectedBill}
      accessToken={accessToken}
      onClose={() => setSelectedBill(null)}
    />

    {/* 5. Counter UPI QR Modal */}
    <UpiQrModal
      isOpen={qrModalState.isOpen}
      amount={qrModalState.amount}
      patientName={qrModalState.patientName}
      onClose={() => setQrModalState({ ...qrModalState, isOpen: false })}
    />

    {/* 6. PWA Mobile & PC App Download/Install Modal */}
    <PWAInstallModal
      isOpen={showInstallModal}
      onClose={() => setShowInstallModal(false)}
    />

    {/* 7. Share App / Patient Download QR Modal */}
    <ShareAppModal
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
    />

    {/* 8. AI Doctor Health & Prescription Assistant Modal */}
    <AiDoctorAssistantModal
      isOpen={showAiModal}
      onClose={() => setShowAiModal(false)}
    />

    </div>
  );
}
