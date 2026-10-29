import React, { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  X,
  Receipt,
  Phone,
  MapPin,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  CreditCard,
  QrCode,
  Cloud,
} from 'lucide-react';
import { SaleBill } from '../types';
import { CLINIC_CONFIG, generateUpiQrUrl, openWhatsAppChat } from '../utils/storage';
import { downloadElementAsPdf, generateElementPdfBlob } from '../utils/pdfGenerator';
import { getOrCreateClinicFolder, uploadToDrive } from '../utils/googleDriveService';
import { playClinicChime } from '../utils/sound';
import { sendBillToCustomerWhatsApp, downloadBillPdf } from '../utils/billPdfGenerator';

interface BillPrintModalProps {
  bill: SaleBill | null;
  accessToken?: string | null;
  onClose: () => void;
}

export const BillPrintModal: React.FC<BillPrintModalProps> = ({ bill, accessToken, onClose }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [isDriveUploading, setIsDriveUploading] = useState(false);
  const [driveSuccess, setDriveSuccess] = useState(false);

  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async (format: 'a4' | 'thermal' = 'a4') => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);

    const safeName = bill.name.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
    const filename = `Rita_Clinic_Bill_${bill.billNo}_${safeName}.pdf`;

    const success = await downloadElementAsPdf('bill-sheet', filename, format);
    setIsGeneratingPdf(false);

    if (success) {
      setPdfSuccess(true);
      playClinicChime('success');
      setTimeout(() => setPdfSuccess(false), 3000);
    } else {
      alert('PDF बनाने में त्रुटि हुई, कृपया सीधे प्रिंट बटन का उपयोग करें।');
    }
  };

  const handleWhatsApp = async () => {
    setIsGeneratingPdf(true);
    try {
      await sendBillToCustomerWhatsApp(bill);
      playClinicChime('success');
    } catch (err) {
      console.error('Failed to send WhatsApp bill:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleUploadToDrive = async () => {
    if (!accessToken) {
      alert('कृपया पहले डॉक्टर डैशबोर्ड में "Google Drive" टैब से Google खाता कनेक्ट करें।');
      return;
    }

    setIsDriveUploading(true);
    setDriveSuccess(false);

    try {
      const pdfBlob = await generateElementPdfBlob('bill-sheet');
      if (!pdfBlob) throw new Error('PDF तैयार नहीं हो सका');

      const folderId = await getOrCreateClinicFolder(accessToken);
      const safeName = bill.name.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
      const filename = `Bill_${bill.billNo}_${safeName}.pdf`;

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

  const qrUrl = generateUpiQrUrl(bill.balance > 0 ? bill.balance : bill.total, `Bill-${bill.billNo}`);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[95vh]">
        
        {/* Top Control Bar (Non-printable) */}
        <div className="no-print bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/40 border border-emerald-400 flex items-center justify-center text-emerald-200">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm">दवा बिक्री रसीद (Pharmacy Invoice)</h3>
              <p className="text-[11px] text-emerald-200">बिल नं: {bill.billNo} • {bill.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download PDF button */}
            <button
              onClick={() => handleDownloadPdf('a4')}
              disabled={isGeneratingPdf}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${
                pdfSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              }`}
              title="A4 साइज में PDF डाउनलोड करें"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>PDF तैयार हो रहा है...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PDF सेव हुआ!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>📥 PDF डाउनलोड</span>
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
              title="सीधे Google Drive में बिल सेव करें"
            >
              {isDriveUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Drive में...</span>
                </>
              ) : driveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>सुरक्षित!</span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
              title="प्रिंटर से प्रिंट निकालें"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🖨️ प्रिंट (Ctrl+P)</span>
            </button>

            {/* WhatsApp button */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
              title="मरीज को व्हाट्सएप पर भेजें"
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

        {/* Printable Receipt & PDF Area */}
        <div className="p-4 sm:p-6 overflow-y-auto print-container bg-white text-slate-900 font-sans">
          
          <div
            id="bill-sheet"
            className="p-6 bg-white border border-slate-300 rounded-xl relative shadow-sm text-xs"
          >
            {/* Header */}
            <div className="border-b-2 border-emerald-900 pb-3 mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
                  PHARMACY & HEALTHCARE
                </span>
                <span className="text-[10px] text-slate-500">मुजफ्फरपुर, बिहार</span>
              </div>

              <div className="flex items-center justify-center gap-3 my-1">
                <img
                  src="/clinic-logo.png"
                  alt="Rita Clinic Logo"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-emerald-900 object-cover shadow-xs shrink-0"
                />
                <div className="text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-wide">
                    {CLINIC_CONFIG.name}
                  </h2>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{CLINIC_CONFIG.doctorName}</p>
                  <p className="text-[10px] text-slate-500">{CLINIC_CONFIG.degrees}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 mt-1 flex items-center justify-center gap-1 text-center">
                <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 inline" />
                <span>{CLINIC_CONFIG.address}</span>
              </p>
              <p className="text-[11px] font-bold text-emerald-900 mt-0.5 text-center">
                हेल्पलाइन: {CLINIC_CONFIG.phone} • UPI ID: {CLINIC_CONFIG.upiId}
              </p>

              <div className="mt-2 text-center">
                <span className="inline-block px-3 py-0.5 bg-emerald-50 text-emerald-900 font-black text-[11px] rounded uppercase border border-emerald-300">
                  दवा बिक्री रसीद / CASH MEMO
                </span>
              </div>
            </div>

            {/* Bill Info Strip */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-3 text-[11px]">
              <div>
                <p><span className="text-slate-500">बिल संख्या (Bill No):</span> <strong className="font-mono text-emerald-900 text-xs">{bill.billNo}</strong></p>
                <p className="mt-0.5"><span className="text-slate-500">ग्राहक/मरीज:</span> <strong className="text-slate-900">{bill.name}</strong></p>
                {bill.phone && <p className="mt-0.5"><span className="text-slate-500">मो.:</span> {bill.phone}</p>}
              </div>
              <div className="text-right">
                <p><span className="text-slate-500">दिनांक (Date):</span> <strong>{bill.date}</strong></p>
                <p className="mt-0.5"><span className="text-slate-500">भुगतान माध्यम:</span> <strong className="text-blue-900">{bill.paymentMode}</strong></p>
                <p className="mt-0.5">
                  <span className="text-slate-500">स्थिति:</span>{' '}
                  <strong className={bill.balance > 0 ? 'text-red-600' : 'text-emerald-700'}>
                    {bill.balance > 0 ? `बाकी ₹${bill.balance}` : 'पूर्ण चुकता'}
                  </strong>
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-3">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[11px]">
                    <th className="py-2 px-2.5 w-8 text-center">क्र.</th>
                    <th className="py-2 px-2.5">सामग्री / दवाइयां (Item Description)</th>
                    <th className="py-2 px-2.5 text-center w-14">मात्रा</th>
                    <th className="py-2 px-2.5 text-right w-16">दर (₹)</th>
                    <th className="py-2 px-2.5 text-right w-20">रकम (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bill.items.map((item, idx) => (
                    <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2 px-2.5 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2.5 font-bold text-slate-900">{item.name}</td>
                      <td className="py-2 px-2.5 text-center text-slate-700">{item.qty}</td>
                      <td className="py-2 px-2.5 text-right text-slate-700">{item.price}</td>
                      <td className="py-2 px-2.5 text-right font-bold text-slate-900">₹{item.qty * item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & QR Code Section */}
            <div className="grid grid-cols-12 gap-3 pt-2 border-t-2 border-slate-800 mb-4 items-center">
              
              {/* Left: Scan & Pay QR */}
              <div className="col-span-5 bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center gap-2">
                <img
                  src={qrUrl}
                  alt="UPI QR"
                  className="w-16 h-16 rounded border border-slate-300 shrink-0 object-contain bg-white"
                />
                <div className="text-[9px] text-slate-600 leading-tight">
                  <p className="font-bold text-slate-900">स्कैन करके भुगतान करें</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">PhonePe • GPay • Paytm</p>
                  <p className="font-mono text-emerald-800 font-bold mt-0.5">{CLINIC_CONFIG.upiId}</p>
                </div>
              </div>

              {/* Right: Totals */}
              <div className="col-span-7 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">कुल योग (Sub Total):</span>
                  <span className="font-semibold">₹{bill.subTotal}</span>
                </div>

                {bill.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>विशेष छूट (Discount):</span>
                    <span>-₹{bill.discount}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-black border-t border-slate-300 pt-1 text-slate-950">
                  <span>अंतिम देय (Net Amount):</span>
                  <span className="text-emerald-950">₹{bill.total}</span>
                </div>

                <div className="flex justify-between text-xs pt-0.5">
                  <span className="text-slate-600">प्राप्त राशि (Paid):</span>
                  <span className="font-bold text-emerald-700">₹{bill.paid}</span>
                </div>

                {bill.balance > 0 ? (
                  <div className="flex justify-between text-xs font-bold text-red-600 bg-red-50 p-1 rounded">
                    <span>शेष उधारी (Balance Due):</span>
                    <span>₹{bill.balance}</span>
                  </div>
                ) : (
                  <div className="text-right text-[10px] font-bold text-emerald-700">
                    ✓ पूर्ण भुगतान प्राप्त हुआ (PAID)
                  </div>
                )}
              </div>

            </div>

            {/* Footer Disclaimer & Auth */}
            <div className="border-t border-slate-200 pt-3 flex justify-between items-end text-[10px] text-slate-500">
              <div>
                <p>• डॉक्टर की पर्ची के बिना शेड्यूल दवाइयां नहीं दी जातीं।</p>
                <p>• बिकी हुई दवाइयां 7 दिन में सील पैक के साथ ही वापस होंगी।</p>
                <p className="font-semibold text-slate-700 mt-0.5">स्वस्थ जीवन की शुभकामनाएं! — रीता क्लिनिक</p>
              </div>
              <div className="text-center w-36">
                <div className="h-6 border-b border-slate-400 mb-0.5 flex items-end justify-center">
                  <span className="text-[10px] italic font-serif text-blue-900">Rita Clinic Counter</span>
                </div>
                <p className="font-bold text-[10px] text-slate-800">अधिकृत हस्ताक्षर / मोहर</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
