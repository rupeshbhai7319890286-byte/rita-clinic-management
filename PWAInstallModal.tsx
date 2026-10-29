import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  CheckCircle2,
  X,
  Share2,
  ExternalLink,
  Sparkles,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { CLINIC_CONFIG, getPublicShareUrl } from '../utils/storage';
import { playClinicChime } from '../utils/sound';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [deviceTab, setDeviceTab] = useState<'android' | 'desktop' | 'ios'>(
    isIOS ? 'ios' : isAndroid ? 'android' : 'desktop'
  );
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (!isOpen) return null;

  const publicUrl = getPublicShareUrl();

  const handleInstallClick = async () => {
    setInstalling(true);
    const success = await install();
    setInstalling(false);
    if (success) {
      setInstalledSuccess(true);
      playClinicChime('success');
      setTimeout(() => {
        setInstalledSuccess(false);
        onClose();
      }, 2500);
    }
  };

  const handleDownloadDesktopShortcut = () => {
    // Generates a desktop shortcut file (.url) that opens the public clinic app directly
    const appUrl = publicUrl;
    const shortcutContent = `[InternetShortcut]\nURL=${appUrl}\nIconIndex=0\n`;
    const blob = new Blob([shortcutContent], { type: 'application/internet-shortcut' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Rita_Clinic_App.url';
    a.click();
    URL.revokeObjectURL(url);
    playClinicChime('success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-4 text-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/clinic-logo.png"
              alt="Rita Clinic Official Logo"
              className="w-14 h-14 rounded-full border-2 border-amber-300 shadow-md object-cover bg-white shrink-0"
            />
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full mb-1">
                <span>ऑफिशियल Android APK व ऐप पैकेज</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">रीता क्लिनिक APK / ऐप डाउनलोड</h2>
              <p className="text-xs text-blue-200">
                डॉ. रूपेश कुमार पोद्दार (साइकिल चौक, मोहनपुर)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">

          {/* Official Doctor Logo Badge */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-3 flex items-center gap-3">
            <img
              src="/clinic-logo.png"
              alt="Rita Clinic Logo"
              className="w-12 h-12 rounded-full border-2 border-emerald-700 object-cover bg-white shrink-0 shadow-xs"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                ✓ ऑफिशियल ऐप लोगो (Official App Icon)
              </span>
              <p className="font-bold text-slate-900 text-xs">
                रीता क्लिनिक — डॉ. रूपेश कुमार पोद्दार
              </p>
              <p className="text-[10px] text-slate-500">
                इंस्टॉल होने के बाद फोन की होम स्क्रीन पर यही आधिकारिक फोटो और लोगो दिखेगा।
              </p>
            </div>
          </div>

          {/* Direct APK File Download Box (Solves 403 Google Error Forever) */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-2.5 border border-emerald-500/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/30 border border-emerald-400 flex items-center justify-center font-bold text-white text-lg shrink-0">
                  🤖
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">RitaClinic.apk (ऑफिशियल Android फाइल)</h4>
                  <p className="text-[10px] text-emerald-200">साइज: 11.7 MB • 100% ऑफलाइन • बिना किसी 403 एरर के</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                APK फाइल
              </span>
            </div>

            <p className="text-[11px] text-emerald-100 leading-relaxed">
              यह असली Android APK फाइल है। इसे डाउनलोड करके आप सीधे अपने फोन में इंस्टॉल कर सकते हैं और किसी भी मरीज को WhatsApp पर 'Document' की तरह भेज सकते हैं!
            </p>

            <a
              href="/RitaClinic.apk"
              download="RitaClinic.apk"
              className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>📥 सीधा RitaClinic.apk डाउनलोड करें (11.7 MB)</span>
            </a>
          </div>

          {/* Main Direct Install Button (If browser supports 1-click install) */}
          {isInstallable && !isInstalled && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 text-center space-y-2.5 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-emerald-900 font-black text-sm sm:text-base">
                <Sparkles className="w-5 h-5 text-emerald-600 animate-bounce" />
                <span>या 1-क्लिक में फोन की स्क्रीन पर जोड़ें!</span>
              </div>
              <p className="text-xs text-emerald-800">
                नीचे दिए गए हरे बटन को दबाते ही आपके फोन पर डॉ. रूपेश कुमार पोद्दार जी के लोगो वाली रीता क्लिनिक ऐप आ जाएगी:
              </p>
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>{installing ? 'इंस्टॉल हो रहा है...' : '📲 अभी Android फोन में इंस्टॉल करें (Install App)'}</span>
              </button>
            </div>
          )}

          {installedSuccess && (
            <div className="bg-emerald-100 text-emerald-900 p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <span>बधाई! ऐप सफलतापूर्वक आपके फोन/डेस्कटॉप पर जुड़ गया है।</span>
            </div>
          )}

          {/* Device Tabs */}
          <div>
            <p className="font-bold text-slate-800 mb-2">
              अपने डिवाइस के अनुसार आसान तरीका चुनें (How to Download):
            </p>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setDeviceTab('android')}
                className={`py-2 text-center rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  deviceTab === 'android'
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Android फोन</span>
              </button>
              <button
                onClick={() => setDeviceTab('desktop')}
                className={`py-2 text-center rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  deviceTab === 'desktop'
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-blue-600" />
                <span>कंप्यूटर / PC</span>
              </button>
              <button
                onClick={() => setDeviceTab('ios')}
                className={`py-2 text-center rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  deviceTab === 'ios'
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🍎 iPhone / iPad</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Android Instructions */}
          {deviceTab === 'android' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Chrome ब्राउज़र में 3 बिंदुओं (⋮) पर टैप करें</span>
              </h4>
              <p className="text-[11px] text-slate-600 pl-6">
                फोन में ऊपर या नीचे दाईं ओर दिए गए <strong>तीन बिन्दुओं (⋮)</strong> के मेनू बटन पर क्लिक करें।
              </p>

              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>"Install app" या "Add to Home Screen" चुनें</span>
              </h4>
              <p className="text-[11px] text-slate-600 pl-6">
                मेनू में <strong>"Install app"</strong> (ऐप इंस्टॉल करें) अथवा <strong>"Add to Home Screen (होम स्क्रीन पर जोड़ें)"</strong> विकल्प दिखेगा, उस पर टैप करें।
              </p>

              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                <span>"Install" दबाएं ➔ ऐप तैयार!</span>
              </h4>
              <p className="text-[11px] text-slate-600 pl-6">
                अब आपके फोन की होम स्क्रीन पर रीता क्लिनिक का लोगो और आइकन आ जाएगा। बिना इंटरनेट या धीमे नेट में भी यह तुरंत खुलेगा!
              </p>

              <div className="bg-amber-50 text-amber-900 p-2.5 rounded-xl border border-amber-200 text-[11px]">
                💡 <strong>नोट:</strong> अगर आप इस लिंक को WhatsApp के अंदर देख रहे हैं, तो ऊपर 3 बिंदु दबाकर <strong>"Open in Chrome"</strong> चुनें ताकि डाउनलोड तुरंत हो सके।
              </div>
            </div>
          )}

          {/* Tab 2: Desktop Instructions */}
          {deviceTab === 'desktop' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>URL बार में "Install" (⬇️) आइकन दबाएं</span>
              </h4>
              <p className="text-[11px] text-slate-600 pl-6">
                Google Chrome या Microsoft Edge ब्राउज़र के एड्रेस बार में दाईं ओर एक <strong>कंप्यूटर / इंस्टॉल (⊕ या ⬇️)</strong> का आइकन दिखाई देगा, उस पर क्लिक करें।
              </p>

              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>अथवा मेनू (⋮) ➔ "Create shortcut" चुनें</span>
              </h4>
              <p className="text-[11px] text-slate-600 pl-6">
                ब्राउज़र मेनू (⋮) ➔ <strong>"Cast, save, and share"</strong> ➔ <strong>"Create shortcut..."</strong> चुनें और <strong>"Open as window"</strong> टिक करें।
              </p>

              {/* Direct Desktop Shortcut Download File */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  onClick={handleDownloadDesktopShortcut}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>🖥️ डेस्कटॉप शॉर्टकट फाइल डाउनलोड करें (.url)</span>
                </button>
                <p className="text-[10px] text-slate-500 text-center mt-1">
                  इस फाइल को डाउनलोड करके अपने कंप्यूटर के डेस्कटॉप पर रख लें। डबल-क्लिक करने पर क्लिनिक तुरंत खुल जाएगा!
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: iOS Safari Instructions */}
          {deviceTab === 'ios' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Safari में नीचे Share (📤) बटन पर टैप करें</span>
              </h4>
              <p className="text-[11px] text-slate-600 pl-6">
                iPhone / iPad के Safari ब्राउज़र में सबसे नीचे बीच में दिए गए तीर वाले <strong>Share (📤)</strong> आइकन पर टैप करें।
              </p>

              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">2</span>
                <span>"Add to Home Screen" (+) चुनें</span>
              </h4>
              <p className="text-[11px] text-slate-600 pl-6">
                नीचे स्क्रॉल करके <strong>"Add to Home Screen (होम स्क्रीन में जोड़ें)"</strong> पर टैप करें और ऊपर 'Add' दबाएं।
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>रीता क्लिनिक • 100% सुरक्षित व प्रमाणित</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
          >
            बंद करें (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
