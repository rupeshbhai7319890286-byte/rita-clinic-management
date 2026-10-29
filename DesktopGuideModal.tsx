import React, { useState } from 'react';
import { Monitor, Printer, Smartphone, QrCode, HardDriveDownload, Bell, X, CheckCircle2, ChevronRight, Share2, ShieldCheck } from 'lucide-react';
import { CLINIC_CONFIG } from '../utils/storage';

interface DesktopGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopGuideModal: React.FC<DesktopGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'install' | 'print' | 'counter' | 'backup'>('install');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold mb-2">
              <Monitor className="w-3.5 h-3.5" />
              <span>डेस्कटॉप व लैपटॉप सेटअप गाइड (Desktop Instructions)</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">कंप्यूटर/लैपटॉप पर इसे कैसे चलाएं?</h2>
            <p className="text-xs text-blue-200 mt-1">
              {CLINIC_CONFIG.name} — डॉ. रूपेश कुमार पोद्दार (मोहनपुर, मुजफ्फरपुर)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'install'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4 text-blue-600" />
            1. डेस्कटॉप ऐप आइकन बनाएं
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'print'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            2. पर्चा व रसीद प्रिंट
          </button>
          <button
            onClick={() => setActiveTab('counter')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'counter'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-amber-600" />
            3. काउंटर QR व WhatsApp
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDriveDownload className="w-4 h-4 text-purple-600" />
            4. बैकअप व सुरक्षा
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4 text-sm text-slate-700">
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-bold text-blue-900 text-base mb-1 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  डेस्कटॉप पर असली सॉफ्टवेयर की तरह कैसे लगाएं:
                </h3>
                <p className="text-xs text-blue-800 leading-relaxed">
                  इस वेबसाइट को आप अपने कंप्यूटर या लैपटॉप के डेस्कटॉप पर एक ऐप आइकन बनाकर रख सकते हैं। जब भी आप उस आइकन पर क्लिक करेंगे, यह बिना ब्राउज़र के सीधे पूरे स्क्रीन पर एक क्लिनिक सॉफ्टवेयर की तरह खुलेगा!
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Chrome या Edge ब्राउज़र में खोलें</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      अपने कंप्यूटर पर इस लिंक को Google Chrome या Microsoft Edge ब्राउज़र में खोलें।
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">तीन बिन्दुओं (⋮) मेनू पर क्लिक करें</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      ब्राउज़र के ऊपर दाहिनी ओर (Top Right) <strong>तीन बिन्दुओं (⋮)</strong> पर क्लिक करें।
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">"Save and share" → "Create shortcut..." चुनें</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      मेनू में <strong>"Cast, save, and share"</strong> या <strong>"More Tools"</strong> में जाकर <strong>"Create shortcut..."</strong> या <strong>"Install Rita Clinic"</strong> पर क्लिक करें।
                    </p>
                    <div className="mt-2 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium">
                      ⚠️ ध्यान दें: <strong>"Open as window"</strong> के डिब्बे (Checkbox) पर टिक जरूर लगाएं।
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-900 text-sm">तैयार! डेस्कटॉप पर रीता क्लिनिक का आइकन आ जाएगा</h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      अब जब भी आप कंप्यूटर शुरू करेंगे, डेस्कटॉप पर दिए गए <strong>रीता क्लिनिक</strong> आइकन पर डबल-क्लिक करके बिना इंटरनेट रुकावट तुरंत क्लिनिक का सारा काम कर सकते हैं।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'print' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h3 className="font-bold text-emerald-900 text-base mb-1 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-600" />
                  डॉक्टर का पर्चा (Rx) और दवा बिल प्रिंट कैसे करें?
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  इस सिस्टम में इन-बिल्ट ऑफिशियल मेडिकल प्रिस्क्रिप्शन पैड और बिलिंग रसीद बनाई गई है, जो सीधे आपके कंप्यूटर से जुड़े प्रिंटर पर 1-क्लिक में प्रिंट हो जाती है।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold mb-1">
                    📄 A4 / नॉर्मल प्रिंटर
                  </span>
                  <p className="text-xs text-slate-700">
                    मरीज का पर्चा (Prescription) A4 शीट या आधे A5 पैड पर डॉक्टर के नाम, पता, फोन, मरीज की उम्र, बीपी, लक्षण और दवाओं की खुराक के साथ साफ प्रिंट होता है।
                  </p>
                </div>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-1">
                    🧾 थर्मल POS प्रिंटर (80mm)
                  </span>
                  <p className="text-xs text-slate-700">
                    दुकान के काउंटर पर लगे छोटे थर्मल प्रिंटर से मरीज को तुरंत कैश मीमो / बिल पर्ची प्रिंट करके दे सकते हैं।
                  </p>
                </div>
              </div>

              <div className="bg-slate-100 p-3 rounded-xl text-xs space-y-1.5 text-slate-600 border border-slate-200">
                <p className="font-semibold text-slate-800">शॉर्टकट कुंजी (Keyboard Shortcut):</p>
                <p>• किसी भी पर्चे या बिल पर <strong>"प्रिंट करें"</strong> बटन दबाएं या कीबोर्ड पर <strong>Ctrl + P</strong> दबाएं।</p>
                <p>• प्रिंटर डायलॉग में "Save as PDF" चुनकर मरीज को व्हाट्सएप पर पीडीएफ भी भेज सकते हैं।</p>
              </div>
            </div>
          )}

          {activeTab === 'counter' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="font-bold text-amber-900 text-base mb-1 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-600" />
                  काउंटर QR कोड और WhatsApp का उपयोग
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  काउंटर पर कंप्यूटर स्क्रीन या टैबलेट को मरीज के सामने रखकर सीधे UPI से भुगतान ले सकते हैं और उधारी का तकाजा व्हाट्सएप पर भेज सकते हैं।
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900">ऑटोमैटिक अमाउंट UPI QR (7319890286@upi)</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      जब आप किसी मरीज का बिल ₹250 बनाते हैं, तो "UPI QR दिखाएं" पर क्लिक करने पर स्क्रीन पर ठीक ₹250 का ही QR कोड बन जाता है। मरीज को राशि डालने की जरूरत नहीं होती!
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-green-100 text-green-700 rounded-lg shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900">1-क्लिक WhatsApp उधारी तकाजा व पर्चा</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      उधारी खाते में जिस मरीज का बकाया है, उसके नाम के आगे <strong>"WhatsApp तकाजा"</strong> बटन दबाते ही कंप्यूटर में खुला WhatsApp Web अपने आप सम्मानपूर्वक हिंदी में तकाजा मैसेज लिख देगा!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h3 className="font-bold text-purple-900 text-base mb-1 flex items-center gap-2">
                  <HardDriveDownload className="w-5 h-5 text-purple-600" />
                  क्लिनिक डेटा बैकअप व सुरक्षा (Data Backup)
                </h3>
                <p className="text-xs text-purple-800 leading-relaxed">
                  आपके मरीजों की सूची, पर्चे, दवाइयों के बिल और उधारी खाता आपके कंप्यूटर में सुरक्षित रहता है। आप सप्ताह में एक बार बैकअप फाइल डाउनलोड करके रख सकते हैं।
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>एडमिन पिन सुरक्षा:</strong> डॉक्टर एडमिन मोड 4 अंकों के पिन (डिफ़ॉल्ट <strong>1234</strong>) से सुरक्षित है ताकि मरीज इसे न बदल सकें।</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>ऑफलाइन सुविधा:</strong> इंटरनेट धीमा होने पर भी काउंटर बिलिंग और पर्चा बनाना कभी नहीं रुकेगा।</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>JSON / Excel बैकअप:</strong> ऊपर 'डेटा बैकअप' बटन से एक क्लिक में सारा हिसाब आपके कंप्यूटर के Downloads फोल्डर में सेव हो जाता है।</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>रीता क्लिनिक — डॉ. रूपेश कुमार पोद्दार (मो. 7319890286)</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
          >
            <span>समझ गया (Got It)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
