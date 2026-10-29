import React, { useState } from 'react';
import {
  Share2,
  QrCode,
  Copy,
  CheckCircle2,
  X,
  Phone,
  Printer,
  Sparkles,
  ExternalLink,
  Smartphone,
  Send,
  Download,
} from 'lucide-react';
import {
  CLINIC_CONFIG,
  getPublicShareUrl,
  getCustomPublicUrl,
  setCustomPublicUrl,
  openWhatsAppChat,
} from '../utils/storage';
import { playClinicChime } from '../utils/sound';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [patientPhone, setPatientPhone] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState(() => getCustomPublicUrl());
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlSavedSuccess, setUrlSavedSuccess] = useState(false);

  if (!isOpen) return null;

  // Use the verified public/shared URL that works for all patients without Google 403 Forbidden error
  const publicUrl = getPublicShareUrl();
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    publicUrl
  )}`;

  const shareText =
    `🏥 *रीता क्लिनिक (Rita Clinic) - डॉ. रूपेश कुमार पोद्दार*\n` +
    `साइकिल चौक, मोहनपुर, मुजफ्फरपुर, बिहार | फोन: ${CLINIC_CONFIG.phone}\n\n` +
    `घर बैठे डॉक्टर परामर्श अपॉइंटमेंट लेने, 24 घंटे होम विजिट बुलाने व पर्चा देखने के लिए हमारी ऑफिशियल ऐप खोलें/डाउनलोड करें:\n` +
    `📲 *मरीज ऐप लिंक (Chrome में खोलें):*\n${publicUrl}\n\n` +
    `*मोबाइल में ऐप इंस्टॉल करने का तरीका:*\n` +
    `1. ऊपर दिए लिंक पर क्लिक करके Chrome ब्राउज़र में खोलें।\n` +
    `2. स्क्रीन पर दिए गए "📲 ऐप डाउनलोड करें" बटन को दबाएं।\n` +
    `3. "Install" दबाते ही ऐप आपके फोन की होम स्क्रीन पर आ जाएगी!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    playClinicChime('success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendToPatientPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientPhone.trim()) {
      alert('कृपया मरीज का 10 अंकों का मोबाइल नंबर दर्ज करें!');
      return;
    }
    openWhatsAppChat(patientPhone.trim(), shareText);
    setPatientPhone('');
  };

  const handleSaveCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = customUrlInput.trim();
    setCustomPublicUrl(cleanUrl);
    setUrlSavedSuccess(true);
    playClinicChime('success');
    setTimeout(() => {
      setUrlSavedSuccess(false);
      setIsEditingUrl(false);
    }, 2000);
  };

  const handleResetUrl = () => {
    setCustomPublicUrl('');
    setCustomUrlInput('');
    setUrlSavedSuccess(true);
    playClinicChime('success');
    setTimeout(() => {
      setUrlSavedSuccess(false);
      setIsEditingUrl(false);
    }, 1500);
  };

  const handleShareGeneric = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'रीता क्लिनिक - डॉ. रूपेश कुमार पोद्दार',
          text: shareText,
          url: publicUrl,
        })
        .catch(() => {});
    } else {
      openWhatsAppChat('', shareText);
    }
  };

  const handlePrintQrStandee = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-4 text-slate-800 flex flex-col">
        
        {/* Header (no-print) */}
        <div className="no-print bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Share2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full mb-1">
                <span>मरीज व ग्राहकों के लिए</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">दूसरों के मोबाइल में ऐप कैसे डाउनलोड कराएं?</h2>
              <p className="text-xs text-blue-200">रीता क्लिनिक ऐप शेयरिंग व QR काउंटर स्टैंडी</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Counter Standee & Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Important Notice for 403 Error */}
          <div className="no-print bg-red-50 border-2 border-red-300 rounded-2xl p-3.5 text-red-950 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2 font-black text-red-900 text-xs sm:text-sm">
              <span className="text-base">🚨</span>
              <span>"403 That's an error / You do not have access" क्यों आता है?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-red-900">
              यदि आप अपने मोबाइल/कंप्यूटर के <strong>ऊपर सर्च बार में दिखने वाला (aistudio.google.com)</strong> लिंक कॉपी करके मरीज को भेजेंगे, तो मरीज के फोन में हमेशा यही <strong>403 एरर</strong> आएगा क्योंकि वह केवल आपकी कोडिंग स्क्रीन है!
            </p>
            <p className="text-[11px] font-bold text-red-950 bg-white/70 p-2 rounded-xl border border-red-200">
              👉 <strong>सही तरीका:</strong> मरीज को भेजने के लिए केवल नीचे दिए गए <strong>"तरीका 0 (सीधा APK फाइल भेजें)"</strong>, <strong>"तरीका 1 (QR कोड)"</strong> या <strong>"तरीका 2 (WhatsApp लिंक)"</strong> का उपयोग करें।
            </p>
          </div>

          {/* Method 0: Direct APK File Send on WhatsApp */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-2.5 border border-emerald-500/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/30 border border-emerald-400 flex items-center justify-center font-bold text-white text-lg shrink-0">
                  🤖
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">RitaClinic.apk (सीधा APK पैकेज)</h4>
                  <p className="text-[10px] text-emerald-200">11.7 MB • 0% एरर • सीधे WhatsApp पर भेजें</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                100% पक्का समाधान
              </span>
            </div>

            <p className="text-[11px] text-emerald-100 leading-relaxed">
              अगर किसी भी मरीज को लिंक खोलने में 403 एरर आता है, तो आप नीचे दिए गए बटन से <strong>RitaClinic.apk</strong> अपने फोन में डाउनलोड करके WhatsApp में 'Document' (दस्तावेज़) के रूप में मरीज को भेज दें। मरीज फाइल पर टैप करके इंस्टॉल कर लेगा!
            </p>

            <a
              href="/RitaClinic.apk"
              download="RitaClinic.apk"
              className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>📥 RitaClinic.apk डाउनलोड करें (11.7 MB)</span>
            </a>
          </div>
          <div className="bg-gradient-to-b from-blue-50 to-indigo-50/50 border-2 border-blue-200 rounded-2xl p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2.5 mb-1">
              <img
                src="/clinic-logo.png"
                alt="Rita Clinic Emblem"
                className="w-12 h-12 rounded-full border border-blue-900 object-cover shadow-xs"
              />
              <div className="text-left">
                <h4 className="font-black text-blue-950 text-sm">{CLINIC_CONFIG.name}</h4>
                <p className="text-[10px] text-slate-600 font-semibold">
                  {CLINIC_CONFIG.doctorName} ({CLINIC_CONFIG.degrees})
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white font-black text-xs rounded-full shadow-xs">
              <QrCode className="w-4 h-4" />
              <span>तरीका 1: काउंटर QR कोड स्कैन कराएं</span>
            </div>
            <p className="text-xs text-slate-700">
              मरीज अपने मोबाइल कैमरा या <strong>Google Lens / Paytm / PhonePe / WhatsApp</strong> से इस QR कोड को स्कैन करके सीधे ऐप खोल सकते हैं:
            </p>

            <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-blue-400 inline-block shadow-md">
              <img
                src={qrCodeUrl}
                alt="Rita Clinic App QR Code"
                className="w-48 h-48 mx-auto rounded-xl block object-contain"
              />
              <p className="text-[10px] font-bold text-blue-900 mt-2">
                स्कैन करें ➔ रीता क्लिनिक ऐप इंस्टॉल करें
              </p>
            </div>

            <div className="no-print pt-1">
              <button
                onClick={handlePrintQrStandee}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition-all"
                title="काउंटर पर लगाने के लिए QR कोड पर्चा प्रिंट करें"
              >
                <Printer className="w-3.5 h-3.5 text-blue-300" />
                <span>🖨️ काउंटर स्टैंडी / पोस्टर प्रिंट करें</span>
              </button>
            </div>
          </div>

          {/* Method 2: Direct WhatsApp to Patient Number */}
          <div className="no-print bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <Smartphone className="w-4 h-4 text-green-600" />
              <span>तरीका 2: मरीज के WhatsApp पर सीधे लिंक भेजें</span>
            </div>
            <p className="text-[11px] text-slate-600">
              मरीज का मोबाइल नंबर डालें, 1-क्लिक में डाउनलोड करने के पूरे तरीके के साथ WhatsApp मैसेज चला जाएगा:
            </p>

            <form onSubmit={handleSendToPatientPhone} className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="मरीज का 10 अंकों का मोबाइल नंबर..."
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp भेजें</span>
              </button>
            </form>
          </div>

          {/* Public Link & Custom URL Configuration */}
          <div className="no-print bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-bold block">मरीजों के लिए शेयर लिंक (App URL):</span>
                <span className="text-xs font-mono font-bold text-blue-900 truncate block">
                  {publicUrl}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'कॉपी हुआ!' : 'लिंक कॉपी'}</span>
                </button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1"
                  title="नए टैब में लिंक खोलकर जांचें"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-300" />
                  <span>जांचें</span>
                </a>
              </div>
            </div>

            {/* Custom URL Editor Toggle */}
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-600">
                {getCustomPublicUrl() ? (
                  <span className="text-emerald-700 font-semibold">✓ कस्टम लाइव डोमेन सेट है</span>
                ) : (
                  <span>पब्लिक डोमेन या पब्लिश लिंक सेट करना चाहते हैं?</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingUrl(!isEditingUrl)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                {isEditingUrl ? '✕ छुपाएं' : '⚙️ लिंक बदलें / कस्टम लिंक डालें'}
              </button>
            </div>

            {isEditingUrl && (
              <form onSubmit={handleSaveCustomUrl} className="pt-1 space-y-2 border-t border-slate-200">
                <label className="text-[11px] font-bold text-slate-700 block">
                  अपनी लाइव वेबसाइट या पब्लिश की गई लिंक डालें:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://ritaclinic.in या पब्लिश URL..."
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
                  >
                    {urlSavedSuccess ? '✓ सेव हुआ!' : 'सेव करें'}
                  </button>
                  {getCustomPublicUrl() && (
                    <button
                      type="button"
                      onClick={handleResetUrl}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs"
                      title="मूल URL पर वापस जाएं"
                    >
                      रीसेट
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  💡 टिप: Google AI Studio के Dev लिंक केवल आपके गूगल खाते से चलते हैं। बाहरी मरीजों को सीधे Chrome में खोलने के लिए ऊपर AI Studio के "Publish" बटन से मिला लिंक या अपनी लाइव वेबसाइट का लिंक यहाँ सेव कर सकते हैं।
                </p>
              </form>
            )}
          </div>

          {/* Step by step guide to tell patients */}
          <div className="no-print bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1.5 text-[11px] text-amber-950">
            <p className="font-bold flex items-center gap-1 text-xs text-amber-900">
              <span>💡 मरीज को ऐप डाउनलोड कराने के 3 आसान चरण:</span>
            </p>
            <p>1. मरीज को कहें कि WhatsApp में मिले लिंक पर क्लिक करके <strong>Chrome ब्राउज़र</strong> में खोलें (अगर WhatsApp इन-ऐप ब्राउज़र में खुले तो ऊपर 3 बिंदु ⋮ दबाकर "Open in Chrome" चुनें)।</p>
            <p>2. स्क्रीन पर ऊपर हरे रंग का <strong>"📲 अभी डाउनलोड करें"</strong> बटन दबाएं।</p>
            <p>3. <strong>"Install" (इंस्टॉल)</strong> पर टैप करते ही रीता क्लिनिक का ऐप फोन की होम स्क्रीन पर आ जाएगा!</p>
          </div>


        </div>

        {/* Footer (no-print) */}
        <div className="no-print bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <button
            onClick={handleShareGeneric}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>सोशल मीडिया / WhatsApp पर शेयर</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
          >
            बंद करें (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
