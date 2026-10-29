import React, { useState } from 'react';
import { X, QrCode, CheckCircle, Copy, IndianRupee } from 'lucide-react';
import { CLINIC_CONFIG, generateUpiQrUrl } from '../utils/storage';
import { playClinicChime } from '../utils/sound';

interface UpiQrModalProps {
  isOpen: boolean;
  amount: number;
  patientName?: string;
  onClose: () => void;
  onPaymentRecorded?: (amt: number) => void;
}

export const UpiQrModal: React.FC<UpiQrModalProps> = ({
  isOpen,
  amount: initialAmount,
  patientName,
  onClose,
  onPaymentRecorded,
}) => {
  const [customAmount, setCustomAmount] = useState(initialAmount || 100);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const qrUrl = generateUpiQrUrl(customAmount, `Rita Clinic - ${patientName || 'Consultation'}`);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(CLINIC_CONFIG.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    playClinicChime('success');
    if (onPaymentRecorded) {
      onPaymentRecorded(customAmount);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden text-center p-6 space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              क्लिनिक काउंटर QR
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">UPI भुगतान (Scan & Pay)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {patientName && (
          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
            मरीज / ग्राहक: <strong>{patientName}</strong>
          </p>
        )}

        {/* Dynamic Amount Input */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
          <label className="text-[11px] font-semibold text-emerald-800 block mb-1">
            भुगतान राशि (Amount in ₹)
          </label>
          <div className="flex items-center justify-center gap-1">
            <IndianRupee className="w-5 h-5 text-emerald-700" />
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value) || 0)}
              className="text-2xl font-black text-emerald-900 w-32 text-center bg-white border border-emerald-300 rounded-lg py-1 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* QR Image */}
        <div className="relative inline-block p-2 bg-white rounded-2xl border-2 border-dashed border-emerald-400 shadow-md">
          <img
            src={qrUrl}
            alt="Rita Clinic UPI QR"
            className="w-52 h-52 mx-auto rounded-xl block object-contain"
          />
          <div className="text-[10px] text-slate-500 mt-1.5 font-medium">
            PhonePe • Google Pay • Paytm • BHIM
          </div>
        </div>

        {/* UPI ID badge with copy */}
        <div className="bg-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs">
          <span className="font-mono font-bold text-slate-800">{CLINIC_CONFIG.upiId}</span>
          <button
            onClick={handleCopyUpi}
            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold px-2 py-0.5 rounded bg-white shadow-xs"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'कॉपी हुआ' : 'UPI कॉपी'}</span>
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDone}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>भुगतान प्राप्त हुआ (Payment Received)</span>
        </button>

      </div>
    </div>
  );
};
