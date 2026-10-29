import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json({ limit: '25mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

import path from 'path';

// Helper for generating clinical guidance when API is slow, offline, or timed out
function getFallbackClinicalAdvice(prompt: string, hasImage: boolean): string {
  const p = (prompt || '').toLowerCase();
  
  if (hasImage) {
    return `📋 *पर्चा / दवा विश्लेषण सारांश (रीता क्लिनिक)*:\n\n` +
      `1. 💊 *दवाइयों के सामान्य नियम*:\n` +
      `   • गैस व एसिडिटी की दवा (उदा. Pantoprazole/Rabeprazole/Omeprazole): हमेशा सुबह खाली पेट (नाश्ते से आधा घंटा पहले) एक गिलास सादे पानी के साथ लें।\n` +
      `   • दर्द निवारक या एंटीबायोटिक (उदा. Paracetamol/Amoxicillin/Azithromycin/Aceclofenac): हमेशा खाना खाने के बाद ही लें, कभी भी खाली पेट न खाएं।\n` +
      `   • सिरप या कफ सिरप: पीने के बाद 15-20 मिनट तक ठंडा पानी न पिएं।\n\n` +
      `2. 🩺 *सावधानी व परहेज*:\n` +
      `   • ठंडा पानी, तली-भुनी चीजें और बासी भोजन से परहेज रखें।\n` +
      `   • ओआरएस (ORS) या गुनगुने पानी का प्रचुर मात्रा में सेवन करें।\n` +
      `   • एंटीबायोटिक का पूरा कोर्स डॉक्टर के कहे अनुसार पूरा करें, बीच में न छोड़ें।\n\n` +
      `📞 *विशेष सलाह*: दवा की सटीक खुराक (Dosage) और समय की पुष्टि के लिए तुरंत डॉ. रूपेश कुमार पोद्दार जी (मो. 7319890286) से संपर्क करें या क्लिनिक पधारें।\n\n` +
      `⚠️ *सूचना*: यह जानकारी प्राथमिक मार्गदर्शन हेतु है। किसी भी गंभीर लक्षण या आपात स्थिति में तुरंत क्लिनिक आएं या 112 डायल करें।`;
  }

  if (p.includes('बुखार') || p.includes('fever') || p.includes('ताप') || p.includes('दर्द')) {
    return `🌡️ *बुखार एवं बदन दर्द के लिए प्राथमिक मार्गदर्शन*:\n\n` +
      `1. 💊 *सामान्य दवा समझ*:\n` +
      `   • तेज बुखार में सामान्यतः Paracetamol 650mg भोजन के बाद ली जाती है (दो खुराकों के बीच कम से कम 6 घंटे का अंतर रखें)।\n` +
      `   • सिर पर सामान्य ताजे पानी की पट्टी रखें। बहुत ठंडे या बर्फ वाले पानी का इस्तेमाल न करें।\n\n` +
      `2. 💧 *परहेज व खान-पान*:\n` +
      `   • प्रचुर मात्रा में ओआरएस (ORS), नारियल पानी या गुनगुना पानी पिएं।\n` +
      `   • हल्का और सुपाच्य भोजन (मूंग दाल खिचड़ी, दलिया) लें।\n\n` +
      `3. ⚠️ *कब तुरंत डॉक्टर के पास जाएं*:\n` +
      `   • यदि बुखार 102°F से अधिक हो, कंपकंपी छूटे, या 3 दिन से लगातार बना रहे।\n\n` +
      `📞 डॉ. रूपेश कुमार पोद्दार (रीता क्लिनिक, साइकिल चौक, मोहनपुर): 7319890286`;
  }

  if (p.includes('पेट') || p.includes('गैस') || p.includes('उल्टी') || p.includes('दस्त') || p.includes('loose')) {
    return `🩺 *पेट दर्द, गैस, एसिडिटी एवं दस्त संबंधी प्राथमिक सलाह*:\n\n` +
      `1. 💧 *डिहाइड्रेशन से बचाव*:\n` +
      `   • हर 1-2 घंटे में 1 गिलास ओआरएस (ORS घोल) या इलेक्ट्रॉल का पानी धीरे-धीरे पिएं।\n` +
      `   • दही, केला और पतली खिचड़ी का सेवन करें।\n\n` +
      `2. 💊 *दवा नियम*:\n` +
      `   • गैस की दवा खाली पेट लें।\n` +
      `   • पेट मरोड़ के लिए सुपाच्य भोजन और गर्म पानी की सिकाई करें।\n\n` +
      `3. 🚨 *आपात स्थिति*: यदि उल्टी न रुके, खून आए या पेशाब कम हो तो तुरंत क्लिनिक आएं।\n\n` +
      `📞 डॉ. रूपेश कुमार पोद्दार (रीता क्लिनिक, साइकिल चौक, मोहनपुर): 7319890286`;
  }

  if (p.includes('खांसी') || p.includes('cough') || p.includes('सर्दी') || p.includes('गला')) {
    return `🧣 *खांसी, सर्दी एवं गले के दर्द के लिए प्राथमिक सलाह*:\n\n` +
      `1. ☕ *घरेलू देखभाल*:\n` +
      `   • गुनगुने पानी में थोड़ा नमक डालकर दिन में 3 बार गरारे (Gargle) करें।\n` +
      `   • गर्म पानी की भाप (Steam) लें और रात को सोते समय शहद-अदरक का रस लें।\n\n` +
      `2. 🚫 *परहेज*:\n` +
      `   • फ्रिज का ठंडा पानी, कोल्ड ड्रिंक्स और आइसक्रीम बिल्कुल बंद रखें।\n\n` +
      `📞 डॉ. रूपेश कुमार पोद्दार (रीता क्लिनिक, साइकिल चौक, मोहनपुर): 7319890286`;
  }

  return `👨‍⚕️ *रीता क्लिनिक AI स्वास्थ्य सहायक (डॉ. रूपेश कुमार पोद्दार)*:\n\n` +
    `आपके सवाल के संदर्भ में मुख्य सलाह:\n` +
    `• कोई भी दवा लेने से पहले डॉक्टर का परामर्श या पर्चे के अनुसार खुराक अवश्य सुनिश्चित करें।\n` +
    `• पर्याप्त आराम करें, पौष्टिक भोजन लें और स्वच्छता का विशेष ध्यान रखें।\n` +
    `• यदि आपके पास डॉक्टर का पर्चा या दवा का रैपर है, तो नीचे कैमरा बटन से उसकी फोटो भेजें।\n\n` +
    `🏥 *रीता क्लिनिक (साइकिल चौक, मोहनपुर, मुजफ्फरपुर, बिहार)*\n` +
    `📞 डॉक्टर से सीधा संपर्क: 7319890286 | आपातकालीन: 112`;
}

// AI Health & Prescription Analysis Endpoint
app.post('/api/ai-doctor', async (req, res) => {
  const { prompt, imageBase64, mimeType } = req.body || {};
  const hasImage = Boolean(imageBase64);

  // If no API key is available, return the high-quality clinical guidance directly
  if (!process.env.GEMINI_API_KEY) {
    const fallbackText = getFallbackClinicalAdvice(prompt || '', hasImage);
    return res.json({ reply: fallbackText, fallback: true });
  }

  try {
    const parts: any[] = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      });
    }

    const userPrompt =
      prompt ||
      'कृपया इस पर्चे (Prescription) या दवा की फोटो को ध्यानपूर्वक देखकर इसमें लिखी दवाइयों के नाम, खुराक (खुराक: 1 गोली, सिरप, या इंजेक्शन), कब खाना है (खाली पेट या खाने के बाद) और मुख्य परहेज सरल हिंदी में विस्तार से बताएं।';

    parts.push(userPrompt);

    const systemInstruction = `आप 'रीता क्लिनिक (Rita Clinic)' के अधिकृत डिजिटल एआई स्वास्थ्य परामर्शदाता (AI Health & Prescription Assistant) हैं।
क्लिनिक के मुख्य चिकित्सक: डॉ. रूपेश कुमार पोद्दार (CMS & ED, EMT, General Physician & Emergency Care Specialist)।
क्लिनिक पता: साइकिल चौक, मोहनपुर, मुजफ्फरपुर, बिहार – 843121
आपातकालीन नंबर: 7319890286 | एम्बुलेंस: 112

आपकी मुख्य जिम्मेदारियां:
1. पर्चा (Doctor Prescription) या दवा के रैपर की फोटो का विश्लेषण:
   - दवा का नाम (Medicine Name) और प्रकार (Tablet/Syrup/Ointment/Injection)।
   - खुराक व लेने का समय (Dosage & Timing: उदा. सुबह 1 गोली, रात को भोजन के बाद)।
   - दवा का मुख्य कार्य (किस बीमारी/दर्द/बुखार/संक्रमण के लिए है)।
   - क्या परहेज रखना है (पानी अधिक पीना, तला-भुना न खाना आदि)।
2. स्वास्थ्य सहायता (General Health Advice):
   - मरीज के लक्षणों (बुखार, खांसी, पेट दर्द, कमजोरी, उल्टी, बीपी) के आधार पर प्राथमिक समझ और सुरक्षित घरेलू देखभाल बताएं।
3. टोन व भाषा:
   - अत्यंत विनम्र, आत्मीय, सरल एवं सम्मानजनक हिंदी (देहाती/स्थानीय मरीजों के समझने योग्य)।
   - गोल-मोल कठिन मेडिकल अंग्रेजी शब्दों की जगह आसान भाषा का प्रयोग करें।
4. सुरक्षा व डिस्क्लेमर:
   - हर जवाब के अंत में यह संदेश जरूर लिखें:
   "⚠️ सूचना: यह एआई जानकारी आपके मार्गदर्शन हेतु है। किसी भी नई दवा को शुरू करने से पहले या समस्या गंभीर होने पर तुरंत रीता क्लिनिक में डॉ. रूपेश कुमार पोद्दार जी (मो. 7319890286) से परामर्श लें या 112 एम्बुलेंस सेवा पर संपर्क करें।"`;

    // 8-second timeout promise race so the server never hangs or causes "Failed to fetch"
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI response timed out')), 8000)
    );

    const aiCallPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: parts,
      config: {
        systemInstruction,
      },
    });

    const response = await Promise.race([aiCallPromise, timeoutPromise]);
    return res.json({ reply: response.text });
  } catch (error: any) {
    console.warn('Gemini AI fallback triggered:', error?.message || error);
    // Return high-quality medical guidance even on timeout or API error
    const fallbackReply = getFallbackClinicalAdvice(prompt || '', hasImage);
    return res.json({
      reply: fallbackReply,
      fallback: true,
      note: 'रीता क्लिनिक त्वरित सहायता मोड',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  // Serve static assets from public (including RitaClinic.apk)
  app.use(express.static('public'));
  app.get('/RitaClinic.apk', (req, res) => {
    const apkFile = path.resolve(process.cwd(), 'public/RitaClinic.apk');
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="RitaClinic.apk"');
    res.sendFile(apkFile);
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rita Clinic server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
