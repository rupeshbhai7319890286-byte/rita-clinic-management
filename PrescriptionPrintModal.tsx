import React, { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  X,
  HeartPulse,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  FileText,
  Activity,
  Cloud,
} from 'lucide-react';
import { PatientRecord } from '../types';
import { CLINIC_CONFIG, openWhatsAppChat } from '../utils/storage';
import { downloadElementAsPdf, generateElementPdfBlob } from '../utils/pdfGenerator';
import { getOrCreateClinicFolder, uploadToDrive } from '../utils/googleDriveService';
import { playClinicChime } from '../utils/sound';

interface PrescriptionPrintModalProps {
  patient: PatientRecord | null;
  accessToken?: string | null;
  onClose: () => void;
}

export const PrescriptionPrintModal: React.FC<PrescriptionPrintModalProps> = ({ patient, accessToken, onClose }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [isDriveUploading, setIsDriveUploading] = useState(false);
  const [driveSuccess, setDriveSuccess] = useState(false);

  if (!patient) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);

    const safeName = patient.name.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
    const filename = `Rita_Clinic_Rx_${patient.opdNo}_${safeName}.pdf`;

    const success = await downloadElementAsPdf('prescription-sheet', filename, 'a4');
    setIsGeneratingPdf(false);

    if (success) {
      setPdfSuccess(true);
      playClinicChime('success');
      setTimeout(() => setPdfSuccess(false), 3000);
    } else {
      alert('PDF बनाने में त्रुटि हुई, कृपया सीधे प्रिंट बटन का उपयोग करें।');
    }
  };

  const handleWhatsApp = () => {
    const medList = patient.medicines
      .map((m, idx) => `${idx + 1}. *${m.name}* - खुराक: ${m.dosage} (${m.timing}) [${m.duration}]`)
      .join('\n');

    const msg =
      `*रीता क्लिनिक (Rita Clinic)*\n` +
      `*डॉ. रूपेश कुमार पोद्दार* (CMS & ED, EMT)\n` +
      `साइकिल चौक, मोहनपुर, मुजफ्फरपुर, बिहार | फोन: ${CLINIC_CONFIG.phone}\n\n` +
      `*मरीज का पर्चा (Prescription Summary)*\n` +
      `OPD नं: *${patient.opdNo}*\n` +
      `मरीज का नाम: *${patient.name}*\n` +
      `उम्र व लिंग: ${patient.age} / ${patient.gender}\n` +
      `तारीख: ${patient.createdAt}\n` +
      (patient.bp ? `बीपी: ${patient.bp} | पल्स: ${patient.pulse || 'Normal'}\n` : '') +
      `निदान / समस्या: ${patient.diagnosis || patient.symptoms}\n\n` +
      `*दवाइयां (℞ Prescribed Medicines):*\n${medList}\n\n` +
      `विशेष निर्देश: ${patient.instructions || 'दवा समय पर लें और परहेज रखें।'}\n` +
      (patient.nextVisit ? `अगली जांच: ${patient.nextVisit}\n` : '') +
      `\nआपातकाल में संपर्क करें: ${CLINIC_CONFIG.phone}`;

    openWhatsAppChat(patient.phone, msg);
  };

  const handleUploadToDrive = async () => {
    if (!accessToken) {
      alert('कृपया पहले डॉक्टर डैशबोर्ड में "Google Drive" टैब से Google खाता कनेक्ट करें।');
      return;
    }

    setIsDriveUploading(true);
    setDriveSuccess(false);

    try {
      const pdfBlob = await generateElementPdfBlob('prescription-sheet');
      if (!pdfBlob) throw new Error('PDF तैयार नहीं हो सका');

      const folderId = await getOrCreateClinicFolder(accessToken);
      const safeName = patient.name.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
      const filename = `Rx_${patient.opdNo}_${safeName}.pdf`;

      await uploadToDrive(accessToken, filename, 'application/pdf', pdfBlob, folderId);
      setDriveSuccess(true);
      playClinicChime('success');
      setTimeout(() => setDriveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Drive upload failed:', err);
      alert('Google Drive पर अपलोड विफल: ' + err.message);
    } finally {
      setIsDriveUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[95vh]">
        
        {/* Top Control Bar (Non-printable) */}
        <div className="no-print bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/40 border border-blue-400 flex items-center justify-center text-blue-200">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm">डॉक्टर का डिजिटल पर्चा (Official Rx)</h3>
              <p className="text-[11px] text-blue-200">मरीज: {patient.name} ({patient.opdNo})</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download PDF button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${
                pdfSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
              title="प्रोफेशनल A4 PDF फाइल डाउनलोड करें"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>PDF बन रहा है...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PDF सेव हो गई!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>📥 PDF डाउनलोड करें</span>
                </>
              )}
            </button>

            {/* Google Drive Upload button */}
            <button
              onClick={handleUploadToDrive}
              disabled={isDriveUploading}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${
                driveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
              title="सीधे Google Drive में PDF सेव करें"
            >
              {isDriveUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Drive में जा रहा है...</span>
                </>
              ) : driveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Drive में सुरक्षित!</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span>☁️ Drive में सेव</span>
                </>
              )}
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
              title="प्रिंटर पर प्रिंट करें या PDF सेव करें"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🖨️ प्रिंट (Ctrl+P)</span>
            </button>

            {/* WhatsApp button */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
              title="मरीज को व्हाट्सएप पर पर्चा भेजें"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & PDF Capture Sheet Area */}
        <div className="p-4 sm:p-8 overflow-y-auto print-container bg-white text-slate-900 font-sans">
          
          <div
            id="prescription-sheet"
            className="p-6 sm:p-8 bg-white border border-slate-300 rounded-xl relative shadow-sm"
            style={{ minHeight: '850px' }}
          >
            {/* Background Clinic Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
              <span className="text-9xl font-black text-slate-900 rotate-[-30deg]">RITA CLINIC</span>
            </div>

            {/* ================= HEADER ================= */}
            <div className="border-b-2 border-blue-900 pb-4">
              <div className="flex items-start justify-between">
                
                {/* Left: Official Emblem & Reg */}
                <div className="flex items-center gap-2.5 max-w-[210px]">
                  <img
                    src="/clinic-logo.png"
                    alt="Rita Clinic Logo"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-blue-900 object-cover shadow-xs shrink-0"
                  />
                  <div className="text-[10px] text-slate-600 space-y-0.5 hidden sm:block">
                    <p className="font-bold text-blue-900">प्राथमिक उपचार केंद्र</p>
                    <p>🚨 24H आपातकालीन सेवा</p>
                    <p className="text-slate-500">पंजीयन: बिहार स्वास्थ्य सेवा</p>
                  </div>
                </div>

                {/* Center: Doctor & Clinic Name */}
                <div className="text-center flex-1 px-2">
                  <div className="inline-flex items-center justify-center gap-1.5 mb-1">
                    <span className="w-3 h-3 rounded-full bg-red-600"></span>
                    <span className="text-[11px] font-bold text-red-600 uppercase tracking-widest">
                      EMERGENCY & GENERAL HEALTHCARE
                    </span>
                    <span className="w-3 h-3 rounded-full bg-red-600"></span>
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-wide uppercase">
                    {CLINIC_CONFIG.name}
                  </h1>
                  <h2 className="text-base sm:text-lg font-black text-blue-900 mt-0.5">
                    {CLINIC_CONFIG.doctorName}
                  </h2>
                  <p className="text-xs font-semibold text-slate-700">
                    {CLINIC_CONFIG.degrees}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1 flex items-center justify-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 inline" />
                    <span>{CLINIC_CONFIG.address}</span>
                  </p>
                </div>

                {/* Right: Contact & Emergency */}
                <div className="text-right text-[11px] text-slate-700 space-y-0.5 max-w-[170px]">
                  <p className="font-bold text-emerald-800 flex items-center justify-end gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>हेल्पलाइन: {CLINIC_CONFIG.phone}</span>
                  </p>
                  <p className="font-semibold text-red-600">🚨 आपातकाल: 112</p>
                  <p className="text-slate-500">UPI: {CLINIC_CONFIG.upiId}</p>
                </div>

              </div>
            </div>

            {/* ================= PATIENT DETAILS STRIP ================= */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 my-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">मरीज का नाम (Patient Name)</span>
                  <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">उम्र व लिंग (Age / Gender)</span>
                  <span className="font-semibold text-slate-800">{patient.age} • {patient.gender}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">OPD पंजीयन संख्या (OPD No.)</span>
                  <span className="font-mono font-bold text-blue-900">{patient.opdNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">दिनांक (Date)</span>
                  <span className="font-semibold text-slate-800">{patient.createdAt}</span>
                </div>
              </div>

              {/* Vitals row */}
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap items-center gap-4 text-[11px] text-slate-700">
                <span><strong>ब्लड प्रेशर (BP):</strong> {patient.bp || '120/80 mmHg'}</span>
                <span><strong>नाड़ी (Pulse):</strong> {patient.pulse || '72 bpm'}</span>
                <span><strong>तापमान (Temp):</strong> {patient.temp ? `${patient.temp} °F` : '98.6 °F'}</span>
                {patient.weight && <span><strong>वजन (Wt):</strong> {patient.weight}</span>}
                {patient.phone && <span><strong>मो.:</strong> {patient.phone}</span>}
              </div>
            </div>

            {/* ================= CLINICAL DIAGNOSIS ================= */}
            <div className="mb-4 text-xs bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
              <div className="flex gap-2">
                <span className="font-bold text-slate-700 w-28 shrink-0">मुख्य परेशानी / लक्षण:</span>
                <span className="text-slate-900 font-medium">{patient.symptoms || 'सामान्य स्वास्थ्य समस्या'}</span>
              </div>
              {patient.diagnosis && (
                <div className="flex gap-2 mt-1">
                  <span className="font-bold text-blue-900 w-28 shrink-0">चिकित्सीय निदान:</span>
                  <span className="font-bold text-blue-950 underline decoration-blue-300">{patient.diagnosis}</span>
                </div>
              )}
            </div>

            {/* ================= PRESCRIPTION (Rx) TABLE ================= */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-3xl font-serif font-black text-blue-900 italic leading-none">℞</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    निर्धारित दवाइयां व खुराक (Prescribed Medicines)
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">कृपया भोजन के बाद/पहले का ध्यान रखें</span>
              </div>

              <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2.5 w-10 text-center">क्र.</th>
                      <th className="p-2.5">दवाई का नाम (Medicine Name)</th>
                      <th className="p-2.5">खुराक (Dosage)</th>
                      <th className="p-2.5">समय (Timing)</th>
                      <th className="p-2.5 w-24 text-center">दिन (Duration)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {patient.medicines.map((med, idx) => (
                      <tr key={med.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="p-2.5 text-center font-semibold text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-950 text-[13px]">{med.name}</td>
                        <td className="p-2.5 text-slate-800 font-medium">{med.dosage}</td>
                        <td className="p-2.5 text-slate-700">{med.timing}</td>
                        <td className="p-2.5 text-center font-bold text-blue-900">{med.duration}</td>
                      </tr>
                    ))}
                    {patient.medicines.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                          कोई दवाई दर्ज नहीं की गई।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ================= INSTRUCTIONS / DIET ================= */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs mb-8">
              <h4 className="font-bold text-amber-950 mb-0.5">सलाह व परहेज (Doctor Advice & Dietary Care):</h4>
              <p className="text-amber-900 leading-relaxed font-medium">
                {patient.instructions || 'दवाइयां नियमित समय पर लें। अधिक पानी पिएं। ताजा और सुपाच्य भोजन करें। विश्राम करें।'}
              </p>
              {patient.nextVisit && (
                <p className="font-bold text-blue-900 mt-2">
                  पुनः जांच (Next Follow-up Date): <span className="underline">{patient.nextVisit}</span>
                </p>
              )}
            </div>

            {/* ================= OFFICIAL SIGNATURE & STAMP ================= */}
            <div className="pt-6 border-t border-slate-300 mt-8 flex items-end justify-between">
              
              {/* Left: Verification badge & instructions */}
              <div className="text-[10px] text-slate-500 space-y-1 max-w-[280px]">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>वैध चिकित्सीय परामर्श पर्चा (Valid Prescription)</span>
                </div>
                <p>• कृपया यह पर्चा अगली जांच पर साथ लेकर आएं।</p>
                <p>• दवाइयां केवल योग्य फार्मासिस्ट से ही लें।</p>
                <p className="text-slate-400">मुजफ्फरपुर, बिहार • फोन: {CLINIC_CONFIG.phone}</p>
              </div>

              {/* Center: Official Clinic Seal / Stamp */}
              <div className="hidden sm:block text-center border-2 border-dashed border-blue-400 rounded-full w-24 h-24 p-1.5 opacity-80 rotate-[-8deg]">
                <div className="w-full h-full rounded-full border border-blue-400 flex flex-col items-center justify-center text-[8px] text-blue-900 font-bold leading-tight">
                  <span>RITA CLINIC</span>
                  <span className="text-[7px] text-red-600">MOHANPUR</span>
                  <span>VERIFIED</span>
                  <span className="text-[7px]">MUZAFFARPUR</span>
                </div>
              </div>

              {/* Right: Doctor's Signature */}
              <div className="text-center w-52">
                <div className="h-10 border-b border-slate-400 mb-1 flex items-end justify-center">
                  <span className="text-xs font-serif italic text-blue-950 font-bold">
                    Dr. Rupesh Kr. Poddar
                  </span>
                </div>
                <p className="font-bold text-xs text-slate-900">{CLINIC_CONFIG.doctorName}</p>
                <p className="text-[10px] text-slate-600">{CLINIC_CONFIG.degrees}</p>
                <p className="text-[10px] font-semibold text-blue-900">{CLINIC_CONFIG.name}</p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
