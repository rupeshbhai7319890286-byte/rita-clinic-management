import React, { useState } from 'react';
import {
  Bell,
  UserCheck,
  Receipt,
  CreditCard,
  Plus,
  Search,
  Printer,
  Share2,
  Trash2,
  CheckCircle,
  Phone,
  QrCode,
  IndianRupee,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  X,
  Volume2,
  Cloud,
  Camera,
  RotateCcw,
  Download,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { PatientRecord, RequestItem, RxMedicine, SaleBill, UdhaariRecord } from '../types';
import { CLINIC_CONFIG, getDoctorPhoto, setDoctorPhoto, resetDoctorPhoto, openWhatsAppChat } from '../utils/storage';
import { playClinicChime } from '../utils/sound';
import { GoogleDriveManager } from './GoogleDriveManager';
import { sendBillToCustomerWhatsApp, downloadBillPdf } from '../utils/billPdfGenerator';

interface DoctorDashboardProps {
  requests: RequestItem[];
  patients: PatientRecord[];
  sales: SaleBill[];
  udhaari: UdhaariRecord[];
  user: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onLogout: () => void;
  onUpdateRequestStatus: (id: string, status: RequestItem['status']) => void;
  onAddPatient: (patient: PatientRecord) => void;
  onDeletePatient: (id: string) => void;
  onAddBill: (bill: SaleBill) => void;
  onAddUdhaari: (u: UdhaariRecord) => void;
  onSettleUdhaari: (id: string, amount: number) => void;
  onOpenRxPrint: (patient: PatientRecord) => void;
  onOpenBillPrint: (bill: SaleBill) => void;
  onOpenQrModal: (amount: number, name?: string) => void;
  onOpenDesktopGuide: () => void;
  onExportBackup: () => void;
  onOpenShareApp?: () => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  requests,
  patients,
  sales,
  udhaari,
  user,
  accessToken,
  onAuthSuccess,
  onLogout,
  onUpdateRequestStatus,
  onAddPatient,
  onDeletePatient,
  onAddBill,
  onAddUdhaari,
  onSettleUdhaari,
  onOpenRxPrint,
  onOpenBillPrint,
  onOpenQrModal,
  onOpenDesktopGuide,
  onExportBackup,
  onOpenShareApp,
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'rx' | 'bills' | 'ledger' | 'drive'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [docPhoto, setDocPhoto] = useState<string>(() => getDoctorPhoto());
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setDoctorPhoto(dataUrl);
        setDocPhoto(dataUrl);
        playClinicChime('success');
        alert('डॉक्टर साहब की असली फोटो सफलतापूर्वक सेट हो गई है!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = () => {
    resetDoctorPhoto();
    setDocPhoto('/doctor-photo.png');
    playClinicChime('success');
    alert('मूल फोटो रीसेट हो गई है!');
  };

  // Modals for adding
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [isAddingUdhaari, setIsAddingUdhaari] = useState(false);

  // New Patient Form State
  const [newPtName, setNewPtName] = useState('');
  const [newPtAge, setNewPtAge] = useState('35 वर्ष');
  const [newPtGender, setNewPtGender] = useState('पुरुष');
  const [newPtPhone, setNewPtPhone] = useState('');
  const [newPtBp, setNewPtBp] = useState('120/80');
  const [newPtPulse, setNewPtPulse] = useState('72');
  const [newPtWeight, setNewPtWeight] = useState('');
  const [newPtTemp, setNewPtTemp] = useState('98.6');
  const [newPtSymptoms, setNewPtSymptoms] = useState('');
  const [newPtDiagnosis, setNewPtDiagnosis] = useState('');
  const [newPtInstructions, setNewPtInstructions] = useState('दवा समय पर लें और परहेज रखें।');
  const [newPtFollowUp, setNewPtFollowUp] = useState('5 दिन बाद');
  const [medicines, setMedicines] = useState<RxMedicine[]>([
    { id: '1', name: 'Tab. Paracetamol 650mg', dosage: '1 गोली', timing: 'सुबह-शाम (खाने के बाद)', duration: '3 दिन' },
  ]);

  // New Bill Form State
  const [billName, setBillName] = useState('');
  const [billPhone, setBillPhone] = useState('');
  const [billItems, setBillItems] = useState<{ id: string; name: string; qty: number; price: number }[]>([
    { id: '1', name: 'सामान्य दवाइयां', qty: 1, price: 150 },
  ]);
  const [billDiscount, setBillDiscount] = useState(0);
  const [billPaid, setBillPaid] = useState(150);
  const [billMode, setBillMode] = useState<'UPI' | 'CASH' | 'उधारी'>('UPI');
  const [autoSendBillWhatsApp, setAutoSendBillWhatsApp] = useState<boolean>(true);

  // New Udhaari Form State
  const [udhName, setUdhName] = useState('');
  const [udhPhone, setUdhPhone] = useState('');
  const [udhAmount, setUdhAmount] = useState(500);
  const [udhNotes, setUdhNotes] = useState('');

  // Settle Udhaari Modal
  const [settleItem, setSettleItem] = useState<UdhaariRecord | null>(null);
  const [settleAmount, setSettleAmount] = useState(100);

  // Statistics
  const pendingRequestsCount = requests.filter((r) => r.status === 'लंबित').length;
  const totalUdhaariBal = udhaari.reduce((sum, u) => sum + u.balance, 0);
  const totalSalesToday = sales.reduce((sum, s) => sum + s.total, 0);

  // Handlers
  const handleApprove = (req: RequestItem) => {
    onUpdateRequestStatus(req.id, 'स्वीकृत');
    playClinicChime('success');

    // Notify patient on WhatsApp
    const msg =
      `नमस्ते *${req.name}* जी,\n` +
      `*रीता क्लिनिक (Rita Clinic)* से सूचना:\n` +
      `आपका *${req.type}* अनुरोध स्वीकार (Approved) कर लिया गया है।\n\n` +
      `• टोकन नं: *#${req.tokenNo}*\n` +
      `• समय: *${req.date} ${req.timeSlot || ''}*\n` +
      `• डॉक्टर: डॉ. रूपेश कुमार पोद्दार (CMS & ED, EMT)\n` +
      `• पता: साइकिल चौक, मोहनपुर, मुजफ्फरपुर, बिहार\n` +
      `• फोन: ${CLINIC_CONFIG.phone}\n\n` +
      `कृपया निर्धारित समय पर पधारें। धन्यवाद!`;

    openWhatsAppChat(req.phone, msg);
  };

  const handleAddMedRow = () => {
    setMedicines([
      ...medicines,
      {
        id: String(Date.now()),
        name: '',
        dosage: '1 गोली',
        timing: 'सुबह-शाम (खाने के बाद)',
        duration: '5 दिन',
      },
    ]);
  };

  const handleRemoveMedRow = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPtName.trim()) {
      alert('कृपया मरीज का नाम अवश्य भरें!');
      return;
    }

    const opdNum = `RC-${new Date().getFullYear()}-${String(patients.length + 1).padStart(3, '0')}`;
    const newPatient: PatientRecord = {
      id: 'p_' + Date.now(),
      opdNo: opdNum,
      name: newPtName.trim(),
      age: newPtAge,
      gender: newPtGender,
      phone: newPtPhone.trim(),
      bp: newPtBp.trim() || undefined,
      pulse: newPtPulse.trim() || undefined,
      weight: newPtWeight.trim() || undefined,
      temp: newPtTemp.trim() || undefined,
      symptoms: newPtSymptoms.trim() || 'सामान्य जांच',
      diagnosis: newPtDiagnosis.trim() || 'General Consultation',
      medicines: medicines.filter((m) => m.name.trim() !== ''),
      instructions: newPtInstructions,
      nextVisit: newPtFollowUp,
      createdAt: new Date().toLocaleDateString('hi-IN'),
    };

    onAddPatient(newPatient);
    playClinicChime('success');
    setIsAddingPatient(false);
    // Reset
    setNewPtName('');
    setNewPtPhone('');
    setNewPtSymptoms('');
    setNewPtDiagnosis('');
  };

  const handleAddBillItem = () => {
    setBillItems([...billItems, { id: String(Date.now()), name: '', qty: 1, price: 0 }]);
  };

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billName.trim()) {
      alert('कृपया ग्राहक/मरीज का नाम भरें!');
      return;
    }

    const subTotal = billItems.reduce((acc, it) => acc + it.qty * it.price, 0);
    const finalTotal = Math.max(0, subTotal - billDiscount);
    const bal = Math.max(0, finalTotal - billPaid);

    const newBill: SaleBill = {
      id: 'b_' + Date.now(),
      billNo: `BILL-${Math.floor(100 + Math.random() * 900)}`,
      name: billName.trim(),
      phone: billPhone.trim(),
      date: new Date().toLocaleDateString('hi-IN'),
      items: billItems.filter((i) => i.name.trim() !== ''),
      subTotal,
      discount: billDiscount,
      total: finalTotal,
      paid: billPaid,
      balance: bal,
      paymentMode: billMode,
    };

    onAddBill(newBill);
    playClinicChime('success');
    setIsAddingBill(false);

    // Auto send bill PDF to customer WhatsApp if selected
    if (autoSendBillWhatsApp) {
      setTimeout(() => {
        sendBillToCustomerWhatsApp(newBill);
      }, 300);
    }

    // Auto add to udhaari if balance remains
    if (bal > 0) {
      onAddUdhaari({
        id: 'u_' + Date.now(),
        name: billName.trim(),
        phone: billPhone.trim(),
        balance: bal,
        totalGiven: bal,
        totalReceived: 0,
        lastUpdated: new Date().toLocaleDateString('hi-IN'),
        history: [],
        notes: `बिल ${newBill.billNo} से उधारी`,
      });
    }

    setBillName('');
    setBillPhone('');
  };

  const handleSaveUdhaari = (e: React.FormEvent) => {
    e.preventDefault();
    if (!udhName.trim() || udhAmount <= 0) {
      alert('कृपया नाम और सही उधारी रकम भरें!');
      return;
    }

    onAddUdhaari({
      id: 'u_' + Date.now(),
      name: udhName.trim(),
      phone: udhPhone.trim(),
      balance: udhAmount,
      totalGiven: udhAmount,
      totalReceived: 0,
      lastUpdated: new Date().toLocaleDateString('hi-IN'),
      notes: udhNotes.trim() || 'दवाइयों की बकाया राशि',
      history: [],
    });

    playClinicChime('success');
    setIsAddingUdhaari(false);
    setUdhName('');
    setUdhPhone('');
    setUdhAmount(500);
    setUdhNotes('');
  };

  const handleConfirmSettle = () => {
    if (!settleItem || settleAmount <= 0) return;
    onSettleUdhaari(settleItem.id, settleAmount);
    playClinicChime('success');
    setSettleItem(null);
  };

  const handleSendUdhaariReminder = (u: UdhaariRecord) => {
    const msg =
      `नमस्ते *${u.name}* जी,\n` +
      `*रीता क्लिनिक (Rita Clinic)*, साइकिल चौक, मोहनपुर से सादर स्मरण:\n` +
      `आपके खाते में दवाइयों का कुल बकाया *₹${u.balance}* शेष है।\n\n` +
      `कृपया सुविधानुसार क्लिनिक आकर अथवा नीचे दिए UPI पर जमा कराने का कष्ट करें:\n` +
      `📱 UPI ID: *${CLINIC_CONFIG.upiId}*\n` +
      `डॉक्टर: डॉ. रूपेश कुमार पोद्दार (मो: ${CLINIC_CONFIG.phone})\n\n` +
      `धन्यवाद!`;

    openWhatsAppChat(u.phone, msg);
  };

  return (
    <div className="space-y-4">
      {/* Top Station Stats Bar (Desktop Friendly) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">नए आवेदन (Queue)</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-blue-900">{pendingRequestsCount}</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                  लंबित
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">पंजीकृत मरीज (Rx)</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5 block">{patients.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">आज की दवा बिक्री</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 block">₹{totalSalesToday}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">बाजार में कुल उधारी</span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5 block">₹{totalUdhaariBal}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Desktop Quick Action Buttons Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative group shrink-0">
            <img
              src={docPhoto}
              alt="Dr. Rupesh Kumar Poddar"
              className="w-12 h-12 rounded-full border-2 border-amber-300 shadow object-cover bg-white"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              title="अपनी असली फोटो बदलें / अपलोड करें"
              className="absolute -bottom-1 -right-1 p-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-full shadow-md transition-all cursor-pointer"
            >
              <Camera className="w-3 h-3" />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-bold text-xs sm:text-sm">डॉक्टर वर्कस्टेशन — डॉ. रूपेश कुमार पोद्दार</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                CMS & ED, EMT
              </span>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 text-[10px] font-bold flex items-center gap-1 border border-white/20"
                title="गैलरी या कैमरा से अपनी असली फोटो अपलोड करें"
              >
                <Camera className="w-3 h-3 text-amber-300" />
                <span>फोटो बदलें</span>
              </button>
              {docPhoto !== '/doctor-photo.png' && (
                <button
                  type="button"
                  onClick={handleResetPhoto}
                  className="px-1.5 py-0.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[10px] font-bold flex items-center gap-0.5 border border-red-400/30"
                  title="मूल फोटो पर रीसेट करें"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>रीसेट</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-blue-200">
              साइकिल चौक, मोहनपुर, मुजफ्फरपुर • 🚨 24 घंटे आपातकालीन सेवा व होम विजिट
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onOpenShareApp && (
            <button
              onClick={onOpenShareApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-sm"
              title="मरीज के फोन में ऐप डाउनलोड कराने के लिए QR कोड व WhatsApp शेयर करें"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-200" />
              <span>📲 मरीज को ऐप भेजें / QR</span>
            </button>
          )}

          <button
            onClick={() => onOpenQrModal(200, 'काउंटर परामर्श')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>काउंटर UPI QR</span>
          </button>

          <button
            onClick={() => {
              playClinicChime('notification');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-200 font-semibold rounded-xl transition-all"
            title="घंटी की आवाज चेक करें"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">साउंड टेस्ट</span>
          </button>

          <a
            href="/RitaClinic.apk"
            download="RitaClinic.apk"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            title="सीधा RitaClinic.apk डाउनलोड करें और WhatsApp पर शेयर करें"
          >
            <Download className="w-3.5 h-3.5 text-emerald-200" />
            <span>📥 डाउनलोड APK</span>
          </a>

          <button
            onClick={onExportBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-sm"
            title="कंप्यूटर में बैकअप फाइल सेव करें"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>डेटा बैकअप</span>
          </button>

          <button
            onClick={onOpenDesktopGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>🖥️ डेस्कटॉप गाइड</span>
          </button>
        </div>
      </div>

      {/* Doctor Sharing Tip Banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-950 shadow-xs">
        <div className="flex items-start gap-2.5">
          <span className="text-lg shrink-0 mt-0.5">💡</span>
          <div>
            <p className="font-bold text-amber-900">
              मरीजों के फोन में "403 That's an error" आने से कैसे रोकें?
            </p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              अपने ब्राउज़र के सबसे ऊपर दिखने वाला (aistudio.google.com) लिंक कॉपी न करें। मरीजों को भेजने के लिए नीचे <strong>"📲 मरीज को ऐप भेजें"</strong> बटन दबाकर WhatsApp लिंक या QR कोड दें।
            </p>
          </div>
        </div>
        {onOpenShareApp && (
          <button
            type="button"
            onClick={onOpenShareApp}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shrink-0 shadow-xs flex items-center gap-1.5 self-start sm:self-center"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>📲 मरीज को ऐप भेजें / QR</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs for Doctor */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'inbox'
              ? 'bg-blue-700 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>🔔 नए आवेदन</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rx')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'rx'
              ? 'bg-blue-700 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>👨‍⚕️ मरीज व पर्चा (Rx)</span>
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'bills'
              ? 'bg-blue-700 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>💊 दवा बिक्री बिल</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'ledger'
              ? 'bg-blue-700 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>💳 उधारी बहीखाता</span>
        </button>

        <button
          onClick={() => setActiveTab('drive')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'drive'
              ? 'bg-blue-700 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Cloud className="w-4 h-4 text-sky-500" />
          <span>📁 Google Drive</span>
        </button>
      </div>

      {/* TAB 1: INCOMING REQUESTS QUEUE */}
      {activeTab === 'inbox' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <span>📥 मरीजों से प्राप्त नए आवेदन (Incoming Queue)</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold">
                  कुल: {requests.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                यहाँ मरीज द्वारा ऑनलाइन बुक किए गए अपॉइंटमेंट, होम विजिट व कॉल-बैक अनुरोध आते हैं:
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {requests.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all text-xs ${
                  item.isEmergency
                    ? 'bg-red-50/50 border-red-300'
                    : item.status === 'लंबित'
                    ? 'bg-blue-50/40 border-blue-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{item.name}</span>
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        टोकन #{item.tokenNo}
                      </span>
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                        {item.type}
                      </span>
                      {item.isEmergency && (
                        <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                          🚨 अति-आवश्यक
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'स्वीकृत'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'लंबित'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-slate-700">
                      <strong>समस्या / कारण:</strong> {item.info}
                    </p>

                    {item.address && (
                      <p className="text-purple-900 font-medium">
                        📍 <strong>घर का पता:</strong> {item.address}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px] pt-0.5">
                      <span>
                        📞 <strong>मो.:</strong> {item.phone}
                      </span>
                      {item.age && <span>उम्र: {item.age}</span>}
                      <span>तारीख: {item.date} {item.timeSlot ? `(${item.timeSlot})` : ''}</span>
                      <span>भेजा: {item.createdAt}</span>
                    </div>
                  </div>

                  {/* Actions for this request */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <a
                      href={`tel:${item.phone}`}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>कॉल</span>
                    </a>

                    {item.status === 'लंबित' && (
                      <button
                        onClick={() => handleApprove(item)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 text-xs shadow-sm"
                        title="स्वीकार करें और WhatsApp पर पुष्टि भेजें"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>स्वीकारें (Approve & WhatsApp)</span>
                      </button>
                    )}

                    {item.status === 'स्वीकृत' && (
                      <button
                        onClick={() => onUpdateRequestStatus(item.id, 'पूर्ण')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs"
                      >
                        ✓ पूर्ण (Done)
                      </button>
                    )}

                    <button
                      onClick={() => onUpdateRequestStatus(item.id, 'रद्द')}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="रद्द करें"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {requests.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs">
                कोई नया आवेदन नहीं है।
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT & PRESCRIPTIONS (Rx) */}
      {activeTab === 'rx' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                👨‍⚕️ मरीज डिजिटल रिकॉर्ड व पर्चा (Prescriptions)
              </h3>
              <p className="text-xs text-slate-500">
                मरीजों के इतिहास, जांच व प्रिस्क्रिप्शन प्रिंटिंग का संपूर्ण प्रबंधन
              </p>
            </div>
            <button
              onClick={() => setIsAddingPatient(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ नया मरीज पर्चा बनाएं</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="मरीज का नाम या मोबाइल नंबर से खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Patients List */}
          <div className="space-y-3">
            {patients
              .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm))
              .map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all text-xs space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{p.name}</span>
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        {p.opdNo}
                      </span>
                      <span className="text-slate-600">
                        ({p.age} • {p.gender})
                      </span>
                      {p.phone && <span className="text-slate-500">📞 {p.phone}</span>}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onOpenRxPrint(p)}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg flex items-center gap-1.5 text-xs shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>पर्चा प्रिंट (Rx Print)</span>
                      </button>

                      <button
                        onClick={() => {
                          const medList = p.medicines
                            .map((m, i) => `${i + 1}. *${m.name}* (${m.dosage}, ${m.timing})`)
                            .join('\n');
                          const msg =
                            `*रीता क्लिनिक (Rita Clinic)*\n` +
                            `मरीज: *${p.name}* (OPD: ${p.opdNo})\n` +
                            `निदान: ${p.diagnosis || p.symptoms}\n\n` +
                            `*दवाइयां (Rx):*\n${medList}\n\n` +
                            `डॉ. रूपेश कुमार पोद्दार (मो: ${CLINIC_CONFIG.phone})`;
                          openWhatsAppChat(p.phone, msg);
                        }}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200"
                        title="WhatsApp पर भेजें"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`${p.name} का रिकॉर्ड हटाना चाहते हैं?`)) {
                            onDeletePatient(p.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Vitals & Diagnosis */}
                  <div className="flex flex-wrap gap-3 text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                    {p.bp && <span><strong>BP:</strong> {p.bp}</span>}
                    {p.pulse && <span><strong>Pulse:</strong> {p.pulse} bpm</span>}
                    {p.weight && <span><strong>वजन:</strong> {p.weight}</span>}
                    {p.temp && <span><strong>तापमान:</strong> {p.temp} °F</span>}
                    <span><strong>समस्या/निदान:</strong> {p.diagnosis || p.symptoms}</span>
                  </div>

                  {/* Medicines summary */}
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-800">दवाइयां: </span>
                    {p.medicines.map((m) => `${m.name} [${m.dosage}]`).join(' • ') || 'कोई दवा नहीं'}
                  </div>
                </div>
              ))}

            {patients.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                कोई मरीज रिकॉर्ड नहीं है। "+ नया मरीज पर्चा बनाएं" पर क्लिक करें।
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MEDICINE BILLING COUNTER */}
      {activeTab === 'bills' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                💊 दवाइयां बिक्री व बिलिंग (Pharmacy Sales)
              </h3>
              <p className="text-xs text-slate-500">
                दुकान काउंटर पर दवाइयों की रसीद बनाएं, UPI/Cash भुगतान लें और प्रिंट निकालें
              </p>
            </div>
            <button
              onClick={() => setIsAddingBill(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ नया बिल बनाएं</span>
            </button>
          </div>

          {/* Bills List */}
          <div className="space-y-3">
            {sales.map((b) => (
              <div
                key={b.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{b.name}</span>
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                        {b.billNo}
                      </span>
                      <span className="text-slate-500">तारीख: {b.date}</span>
                    </div>
                    <div className="text-slate-600 mt-1">
                      {b.items.map((it) => `${it.name} (x${it.qty})`).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div className="text-right mr-1">
                      <div className="font-bold text-sm text-slate-900">₹{b.total}</div>
                      <div className="text-[11px] text-slate-500">
                        जमा: ₹{b.paid} ({b.paymentMode})
                        {b.balance > 0 && <span className="text-red-600 font-bold ml-1">• बाकी ₹{b.balance}</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => sendBillToCustomerWhatsApp(b)}
                      className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center gap-1 text-xs shadow-xs"
                      title={b.phone ? `ग्राहक ${b.phone} को WhatsApp PDF व रसीद भेजें` : 'WhatsApp पर भेजें'}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>📲 WhatsApp PDF</span>
                    </button>

                    <button
                      onClick={() => downloadBillPdf(b)}
                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg flex items-center gap-1 text-xs shadow-xs"
                      title="बिल PDF सीधे डिवाइस में डाउनलोड करें"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    <button
                      onClick={() => onOpenBillPrint(b)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg flex items-center gap-1 text-xs"
                      title="रसीद प्रिंट प्रीव्यू देखें"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>प्रिंट</span>
                    </button>

                    <button
                      onClick={() => onOpenQrModal(b.balance > 0 ? b.balance : b.total, b.name)}
                      className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                      title="UPI QR दिखाएं"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {sales.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                कोई बिल नहीं बनाया गया है। "+ नया बिल बनाएं" पर क्लिक करें।
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: UDHAARI LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                💳 उधारी बहीखाता (Credit / Udhaari Khata)
              </h3>
              <p className="text-xs text-slate-500">
                बाजार में बाकी दवाइयों का हिसाब, आंशिक जमा और WhatsApp तकाजा
              </p>
            </div>
            <button
              onClick={() => setIsAddingUdhaari(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ नई उधारी दर्ज करें</span>
            </button>
          </div>

          {/* Ledger Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-100 uppercase tracking-wider font-semibold">
                बाजार में कुल शेष उधारी
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-0.5">₹{totalUdhaariBal}</h2>
            </div>
            <button
              onClick={() => onOpenQrModal(500, 'उधारी जमा')}
              className="px-3.5 py-2 bg-white text-amber-900 font-bold text-xs rounded-xl shadow hover:bg-amber-50 transition-colors flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              <span>काउंटर QR से जमा</span>
            </button>
          </div>

          {/* Udhaari items list */}
          <div className="space-y-3">
            {udhaari.map((u) => (
              <div
                key={u.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{u.name}</span>
                      {u.phone && <span className="text-slate-600 font-medium">📞 {u.phone}</span>}
                    </div>
                    {u.notes && <p className="text-slate-500 mt-0.5">{u.notes}</p>}
                    <p className="text-slate-400 text-[11px] mt-0.5">अंतिम अपडेट: {u.lastUpdated}</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <span className="text-slate-500 text-[11px] block">शेष बाकी:</span>
                      <span className="text-base font-black text-red-600">₹{u.balance}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSettleItem(u);
                        setSettleAmount(u.balance);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs"
                    >
                      जमा करें
                    </button>

                    <button
                      onClick={() => handleSendUdhaariReminder(u)}
                      className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg flex items-center gap-1 text-xs"
                      title="WhatsApp तकाजा भेजें"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>तकाजा</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {udhaari.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                वर्तमान में कोई उधारी खाता दर्ज नहीं है।
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: GOOGLE DRIVE CLOUD STORAGE */}
      {activeTab === 'drive' && (
        <GoogleDriveManager
          user={user}
          accessToken={accessToken}
          onAuthSuccess={onAuthSuccess}
          onLogout={onLogout}
        />
      )}

      {/* MODAL: CREATE NEW PATIENT PRESCRIPTION */}
      {isAddingPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
            <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">👨‍⚕️ नया मरीज परामर्श व पर्चा (Rx)</h3>
                <p className="text-xs text-blue-200">{CLINIC_CONFIG.doctorName} (रीता क्लिनिक)</p>
              </div>
              <button onClick={() => setIsAddingPatient(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="p-5 max-h-[75vh] overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">मरीज का नाम *</label>
                  <input
                    type="text"
                    required
                    value={newPtName}
                    onChange={(e) => setNewPtName(e.target.value)}
                    placeholder="उदा. राम प्रवेश सिंह"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">मोबाइल नंबर</label>
                  <input
                    type="tel"
                    value={newPtPhone}
                    onChange={(e) => setNewPtPhone(e.target.value)}
                    placeholder="उदा. 9876543210"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">उम्र (Age)</label>
                  <input
                    type="text"
                    value={newPtAge}
                    onChange={(e) => setNewPtAge(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">लिंग</label>
                  <select
                    value={newPtGender}
                    onChange={(e) => setNewPtGender(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                  >
                    <option value="पुरुष">पुरुष</option>
                    <option value="महिला">महिला</option>
                    <option value="बच्चा">बच्चा</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ब्लड प्रेशर (BP)</label>
                  <input
                    type="text"
                    value={newPtBp}
                    onChange={(e) => setNewPtBp(e.target.value)}
                    placeholder="120/80"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">पल्स / हार्टबीट</label>
                  <input
                    type="text"
                    value={newPtPulse}
                    onChange={(e) => setNewPtPulse(e.target.value)}
                    placeholder="72 bpm"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">मुख्य लक्षण (Symptoms)</label>
                  <input
                    type="text"
                    value={newPtSymptoms}
                    onChange={(e) => setNewPtSymptoms(e.target.value)}
                    placeholder="उदा. 2 दिन से बुखार, खांसी"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">प्राथमिक निदान (Diagnosis)</label>
                  <input
                    type="text"
                    value={newPtDiagnosis}
                    onChange={(e) => setNewPtDiagnosis(e.target.value)}
                    placeholder="उदा. Acute Pharyngitis with Pyrexia"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Medicines Section */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-xs">℞ दवाइयां (Medicines List)</span>
                  <button
                    type="button"
                    onClick={handleAddMedRow}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                  >
                    + और दवा जोड़ें
                  </button>
                </div>

                <div className="space-y-2">
                  {medicines.map((med, idx) => (
                    <div key={med.id || idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="दवा का नाम (e.g. Paracetamol 650mg)"
                          value={med.name}
                          onChange={(e) => {
                            const updated = [...medicines];
                            updated[idx].name = e.target.value;
                            setMedicines(updated);
                          }}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="खुराक (e.g. 1 गोली)"
                          value={med.dosage}
                          onChange={(e) => {
                            const updated = [...medicines];
                            updated[idx].dosage = e.target.value;
                            setMedicines(updated);
                          }}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="समय (e.g. सुबह-शाम खाने बाद)"
                          value={med.timing}
                          onChange={(e) => {
                            const updated = [...medicines];
                            updated[idx].timing = e.target.value;
                            setMedicines(updated);
                          }}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedRow(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">विशेष निर्देश व परहेज</label>
                <input
                  type="text"
                  value={newPtInstructions}
                  onChange={(e) => setNewPtInstructions(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddingPatient(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow"
                >
                  पर्चा सेव करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW BILL */}
      {isAddingBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">💊 नया दवा बिक्री बिल बनाएं</h3>
                <p className="text-xs text-emerald-200">रीता क्लिनिक काउंटर बिलिंग</p>
              </div>
              <button onClick={() => setIsAddingBill(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="p-5 max-h-[75vh] overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ग्राहक / मरीज का नाम *</label>
                  <input
                    type="text"
                    required
                    value={billName}
                    onChange={(e) => setBillName(e.target.value)}
                    placeholder="मरीज का नाम"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">मोबाइल नंबर</label>
                  <input
                    type="tel"
                    value={billPhone}
                    onChange={(e) => setBillPhone(e.target.value)}
                    placeholder="10 डिजिट नंबर"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-xs">दवाइयां / सामग्री</span>
                  <button
                    type="button"
                    onClick={handleAddBillItem}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
                  >
                    + और सामान जोड़ें
                  </button>
                </div>

                {billItems.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="text"
                      placeholder="दवा का नाम"
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...billItems];
                        updated[idx].name = e.target.value;
                        setBillItems(updated);
                      }}
                      className="col-span-6 p-1.5 border rounded text-xs"
                    />
                    <input
                      type="number"
                      placeholder="मात्रा"
                      value={item.qty}
                      onChange={(e) => {
                        const updated = [...billItems];
                        updated[idx].qty = Number(e.target.value) || 1;
                        setBillItems(updated);
                      }}
                      className="col-span-2 p-1.5 border rounded text-xs text-center"
                    />
                    <input
                      type="number"
                      placeholder="दर ₹"
                      value={item.price}
                      onChange={(e) => {
                        const updated = [...billItems];
                        updated[idx].price = Number(e.target.value) || 0;
                        setBillItems(updated);
                      }}
                      className="col-span-3 p-1.5 border rounded text-xs text-right"
                    />
                    <button
                      type="button"
                      onClick={() => setBillItems(billItems.filter((_, i) => i !== idx))}
                      className="col-span-1 text-center text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">छूट (₹)</label>
                  <input
                    type="number"
                    value={billDiscount}
                    onChange={(e) => setBillDiscount(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">जमा राशि (₹)</label>
                  <input
                    type="number"
                    value={billPaid}
                    onChange={(e) => setBillPaid(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">भुगतान मोड</label>
                  <select
                    value={billMode}
                    onChange={(e) => setBillMode(e.target.value as 'UPI' | 'CASH' | 'उधारी')}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">नकद (Cash)</option>
                    <option value="उधारी">उधारी (Credit)</option>
                  </select>
                </div>
              </div>

              {/* Automatic WhatsApp Bill PDF dispatch checkbox */}
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="autoSendWhatsAppCheckbox"
                  checked={autoSendBillWhatsApp}
                  onChange={(e) => setAutoSendBillWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded mt-0.5 cursor-pointer accent-emerald-600"
                />
                <label htmlFor="autoSendWhatsAppCheckbox" className="cursor-pointer select-none">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                    <span>📲 ग्राहक के WhatsApp पर ऑटोमैटिक PDF व रसीद भेजें</span>
                    <span className="px-1.5 py-0.2 text-[9px] bg-emerald-200 text-emerald-900 rounded font-bold">
                      ऑटोमैटिक
                    </span>
                  </span>
                  <span className="text-[11px] text-emerald-800 block mt-0.5">
                    {billPhone
                      ? `बिल सेव होते ही ${billPhone} पर आधिकारिक बिल PDF और पूरी रसीद स्वतः भेज दी जाएगी।`
                      : 'मोबाइल नंबर दर्ज होते ही बिल सेव करने पर ग्राहक को सीधे WhatsApp पर PDF और रसीद चली जाएगी।'}
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddingBill(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow"
                >
                  बिल सेव करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD UDHAARI */}
      {isAddingUdhaari && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden text-xs">
            <div className="bg-amber-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">💳 नई उधारी दर्ज करें</h3>
              <button onClick={() => setIsAddingUdhaari(false)} className="text-amber-200 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveUdhaari} className="p-4 space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ग्राहक का नाम *</label>
                <input
                  type="text"
                  required
                  value={udhName}
                  onChange={(e) => setUdhName(e.target.value)}
                  placeholder="उदा. विनोद साह"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">मोबाइल नंबर</label>
                <input
                  type="tel"
                  value={udhPhone}
                  onChange={(e) => setUdhPhone(e.target.value)}
                  placeholder="10 डिजिट मोबाइल"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">उधारी रकम (₹) *</label>
                <input
                  type="number"
                  required
                  value={udhAmount}
                  onChange={(e) => setUdhAmount(Number(e.target.value) || 0)}
                  className="w-full p-2 border rounded-lg font-bold text-red-600 text-base"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">विवरण / पहचान</label>
                <input
                  type="text"
                  value={udhNotes}
                  onChange={(e) => setUdhNotes(e.target.value)}
                  placeholder="उदा. साइकिल चौक किराना दुकान"
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddingUdhaari(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  रद्द
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-700 text-white font-bold rounded-lg shadow"
                >
                  खाते में दर्ज करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SETTLE UDHAARI */}
      {settleItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 p-5 text-center text-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">उधारी भुगतान जमा करें</h3>
            <p className="text-slate-600">
              ग्राहक: <strong>{settleItem.name}</strong> • कुल बाकी: <strong>₹{settleItem.balance}</strong>
            </p>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">जमा की जा रही राशि (₹)</label>
              <input
                type="number"
                value={settleAmount}
                onChange={(e) => setSettleAmount(Number(e.target.value) || 0)}
                className="w-32 mx-auto p-2 border rounded-lg font-black text-center text-emerald-800 text-lg"
              />
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setSettleItem(null)}
                className="px-3 py-1.5 border rounded-lg font-semibold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleConfirmSettle}
                className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg shadow"
              >
                जमा दर्ज करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
