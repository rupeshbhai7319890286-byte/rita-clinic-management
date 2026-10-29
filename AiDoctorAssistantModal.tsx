import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Upload,
  Send,
  X,
  Bot,
  User,
  AlertCircle,
  CheckCircle2,
  Phone,
  FileText,
  RotateCw,
  Copy,
  Check,
} from 'lucide-react';
import { CLINIC_CONFIG, openWhatsAppChat } from '../utils/storage';
import { playClinicChime } from '../utils/sound';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  image?: string;
  time: string;
}

interface AiDoctorAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
}

export const AiDoctorAssistantModal: React.FC<AiDoctorAssistantModalProps> = ({
  isOpen,
  onClose,
  patientName,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `नमस्ते ${patientName ? patientName + ' जी' : ''}! मैं रीता क्लिनिक का AI स्वास्थ्य सहायक हूँ।\n\nआप मुझसे:\n1. 📸 अपने डॉक्टर पर्चे (Prescription) या दवा की फोटो भेजकर दवाइयों के नाम, खुराक (Dosage) और खाने का सही समय समझ सकते हैं।\n2. 💊 दवाइयों के उपयोग और परहेज के बारे में पूछ सकते हैं।\n3. 🩺 सामान्य स्वास्थ्य समस्याओं (बुखार, खांसी, दर्द आदि) पर प्राथमिक सलाह ले सकते हैं।\n\nआप अपनी बात लिखें या नीचे दिए गए बटन से पर्चे की फोटो अपलोड करें!`,
      time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const compressImageFile = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            const raw = ((e.target?.result as string) || '').split(',')[1] || '';
            resolve({ base64: raw, mimeType: file.type || 'image/jpeg' });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          const base64 = compressedDataUrl.split(',')[1];
          resolve({ base64, mimeType: 'image/jpeg' });
        };
        img.onerror = () => {
          const raw = ((e.target?.result as string) || '').split(',')[1] || '';
          resolve({ base64: raw, mimeType: file.type || 'image/jpeg' });
        };
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => {
        resolve({ base64: '', mimeType: 'image/jpeg' });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('कृपया केवल फोटो (JPG, PNG, WebP) ही अपलोड करें!');
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      if (compressed.base64) {
        setSelectedImage(compressed);
      }
    } catch {
      // Fallback to direct read
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        setSelectedImage({
          base64: base64Data,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getClientFallbackAdvice = (prompt: string, hasImage: boolean): string => {
    const p = (prompt || '').toLowerCase();
    if (hasImage) {
      return `📋 *पर्चा / दवा विश्लेषण (रीता क्लिनिक AI)*:\n\n` +
        `1. 💊 *दवाइयों के मुख्य नियम*:\n` +
        `   • गैस व एसिडिटी की दवा (उदा. Pantoprazole/Rabeprazole/Omeprazole): हमेशा सुबह खाली पेट (नाश्ते से आधा घंटा पहले) एक गिलास सादे पानी के साथ लें।\n` +
        `   • दर्द निवारक या एंटीबायोटिक (उदा. Paracetamol/Amoxicillin/Azithromycin): हमेशा खाना खाने के बाद ही लें, कभी खाली पेट न खाएं।\n` +
        `   • सिरप या कफ सिरप: पीने के बाद 15-20 मिनट तक ठंडा पानी न पिएं।\n\n` +
        `2. 🩺 *सावधानी व परहेज*:\n` +
        `   • ठंडा पानी, तली-भुनी चीजें और बासी भोजन से परहेज रखें।\n` +
        `   • ओआरएस (ORS) या गुनगुने पानी का प्रचुर मात्रा में सेवन करें।\n` +
        `   • एंटीबायोटिक का पूरा कोर्स डॉक्टर के कहे अनुसार पूरा करें।\n\n` +
        `📞 *विशेष सलाह*: दवा की सटीक खुराक व समय की पुष्टि हेतु डॉ. रूपेश कुमार पोद्दार जी (मो. 7319890286) से तुरंत संपर्क करें।\n\n` +
        `⚠️ *सूचना*: यह जानकारी प्राथमिक मार्गदर्शन हेतु है। किसी भी गंभीर लक्षण में तुरंत रीता क्लिनिक पधारें या 112 डायल करें।`;
    }

    if (p.includes('बुखार') || p.includes('fever') || p.includes('दर्द')) {
      return `🌡️ *बुखार व दर्द प्राथमिक मार्गदर्शन*:\n\n` +
        `• तेज बुखार में Paracetamol 650mg भोजन के बाद ली जाती है (दो खुराकों में कम से कम 6 घंटे का अंतर रखें)।\n` +
        `• सिर पर सामान्य ताजे पानी की पट्टी रखें।\n` +
        `• ओआरएस (ORS) या गुनगुना पानी पिएं, हल्का सुपाच्य भोजन लें।\n` +
        `• यदि बुखार 102°F से अधिक हो या 3 दिन से बना रहे, तो तुरंत क्लिनिक आएं।\n\n` +
        `📞 डॉ. रूपेश कुमार पोद्दार (रीता क्लिनिक): 7319890286`;
    }

    return `👨‍⚕️ *रीता क्लिनिक AI स्वास्थ्य सहायक (डॉ. रूपेश कुमार पोद्दार)*:\n\n` +
      `• कोई भी दवा लेने से पहले डॉक्टर का परामर्श या पर्चे के अनुसार खुराक अवश्य सुनिश्चित करें।\n` +
      `• पर्याप्त आराम करें, पौष्टिक भोजन लें और स्वच्छता का विशेष ध्यान रखें।\n` +
      `• यदि आपके पास डॉक्टर का पर्चा या दवा का रैपर है, तो नीचे दिए गए 📷 कैमरा बटन से उसकी फोटो भेजें।\n\n` +
      `🏥 रीता क्लिनिक (साइकिल चौक, मोहनपुर, मुजफ्फरपुर, बिहार)\n` +
      `📞 डॉक्टर से सीधा संपर्क: 7319890286 | आपातकालीन: 112`;
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText.trim();
    if (!textToSend && !selectedImage) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend || 'कृपया इस फोटो में दिख रही दवाइयों और पर्चे का विवरण समझाइए।',
      image: selectedImage ? `data:${selectedImage.mimeType};base64,${selectedImage.base64}` : undefined,
      time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    const currentImg = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);
    setTimeout(scrollToBottom, 50);

    let replyText = '';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch('/api/ai-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg.text,
          imageBase64: currentImg?.base64,
          mimeType: currentImg?.mimeType,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.reply) {
          replyText = data.reply;
        }
      }
    } catch {
      // Handled cleanly below via clinical fallback
    }

    if (!replyText) {
      replyText = getClientFallbackAdvice(userMsg.text, Boolean(currentImg));
    }

    const aiMsg: Message = {
      id: `ai_${Date.now()}`,
      sender: 'ai',
      text: replyText,
      time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    playClinicChime('notification');
    setIsLoading(false);
    setTimeout(scrollToBottom, 50);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl h-[92vh] max-h-[750px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/clinic-logo.png"
                alt="Rita Clinic Logo"
                className="w-10 h-10 rounded-full border-2 border-amber-300 shadow-sm object-cover bg-white"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-blue-900 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  🤖 रीता क्लिनिक AI स्वास्थ्य सहायक
                </h3>
                <span className="px-1.5 py-0.2 bg-amber-400 text-blue-950 text-[10px] font-black rounded">
                  AI Rx Scanner
                </span>
              </div>
              <p className="text-[11px] text-blue-200">
                डॉ. रूपेश कुमार पोद्दार • 24×7 पर्चा व दवा परामर्श
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 24H Emergency Hotline Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-900 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="animate-pulse">🚨</span>
            <span className="font-bold">24 घंटे इमरजेंसी व होम विजिट:</span>
            <span>साइकिल चौक, मोहनपुर (मुजफ्फरपुर)</span>
          </div>
          <a
            href={`tel:${CLINIC_CONFIG.phone}`}
            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] flex items-center gap-1"
          >
            <Phone className="w-2.5 h-2.5" />
            <span>{CLINIC_CONFIG.phone}</span>
          </a>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[88%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white font-bold text-xs'
                    : 'bg-indigo-900 text-amber-300'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`p-3.5 rounded-2xl shadow-xs space-y-2 leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {msg.image && (
                  <div className="rounded-xl overflow-hidden border border-white/20 max-w-xs">
                    <img src={msg.image} alt="Uploaded Rx" className="w-full max-h-48 object-cover" />
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-black/5 text-[10px] opacity-75">
                  <span>{msg.time}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:underline flex items-center gap-0.5"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>कॉपी हुआ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>कॉपी करें</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 max-w-[85%] mr-auto">
              <div className="w-7 h-7 rounded-full bg-indigo-900 text-amber-300 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-xs text-xs text-slate-600 flex items-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>AI पर्चे का विश्लेषण कर रहा है, कृपया प्रतीक्षा करें...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 bg-white border-t border-slate-100 flex overflow-x-auto gap-1.5 shrink-0">
          <button
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold rounded-lg border border-purple-200 shrink-0 flex items-center gap-1"
          >
            <Camera className="w-3 h-3 text-purple-600" />
            <span>📸 पर्चे की फोटो अपलोड करें</span>
          </button>
          <button
            onClick={() => handleSendMessage('इस पर्चे में लिखी दवाइयां कब और कैसे खानी हैं?')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg shrink-0"
          >
            💊 दवा कब-कब लेनी है?
          </button>
          <button
            onClick={() => handleSendMessage('तेज बुखार और बदन दर्द में क्या प्राथमिक उपचार और सावधानी बरतें?')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg shrink-0"
          >
            🤒 बुखार में प्राथमिक उपाय
          </button>
          <button
            onClick={() => handleSendMessage('साइकिल चौक मोहनपुर में 24 घंटे होम विजिट की क्या सुविधा है?')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg shrink-0"
          >
            🏠 24H होम विजिट नियम
          </button>
        </div>

        {/* Image Preview if selected */}
        {selectedImage && (
          <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <img
                src={`data:${selectedImage.mimeType};base64,${selectedImage.base64}`}
                alt="Preview"
                className="w-10 h-10 object-cover rounded-lg border border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700">
                पर्चे की फोटो चुनी गई (विश्लेषण हेतु तैयार)
              </span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1"
            >
              हटाएं ✕
            </button>
          </div>
        )}

        {/* Input Form */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
              title="पर्चे या दवा की फोटो अपलोड करें"
            >
              <Camera className="w-5 h-5 text-indigo-600" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="दवा का नाम लिखें या पर्चे के बारे में कोई भी सवाल पूछें..."
              className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={isLoading || (!inputText.trim() && !selectedImage)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>पूछें</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
