import jsPDF from 'jspdf';
import { SaleBill } from '../types';
import { CLINIC_CONFIG, getPublicShareUrl } from './storage';

/**
 * Generates an official professional PDF document for a medicine sale bill.
 */
export function generateBillPdfDoc(bill: SaleBill): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header Background banner
  doc.setFillColor(15, 76, 58); // Emerald #0f4c3a
  doc.roundedRect(margin, 12, contentWidth, 34, 3, 3, 'F');

  // Clinic English Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('RITA CLINIC & MEDICAL STORE', margin + contentWidth / 2, 22, { align: 'center' });

  // Doctor & Degrees
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(209, 250, 229); // emerald-100
  doc.text(
    `${CLINIC_CONFIG.doctorName}  |  ${CLINIC_CONFIG.degrees}`,
    margin + contentWidth / 2,
    28,
    { align: 'center' }
  );

  // Address & Contacts
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(230, 255, 245);
  doc.text(
    `Cycle Chowk, Mohanpur, Muzaffarpur, Bihar - 843121  |  Mob: ${CLINIC_CONFIG.phone}  |  UPI: ${CLINIC_CONFIG.upiId}`,
    margin + contentWidth / 2,
    34,
    { align: 'center' }
  );

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PHARMACY CASH MEMO / MEDICINE BILL', margin + contentWidth / 2, 41, { align: 'center' });

  // Bill Meta Details Card
  let curY = 52;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, curY, contentWidth, 24, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Left col
  doc.text('Bill No / रसीद संख्या:', margin + 4, curY + 7);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(bill.billNo, margin + 40, curY + 7);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Customer / मरीज का नाम:', margin + 4, curY + 14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(bill.name || 'Walk-in Customer', margin + 40, curY + 14);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Mobile / फोन नंबर:', margin + 4, curY + 20);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(bill.phone || 'N/A', margin + 40, curY + 20);

  // Right col
  const rightColX = margin + contentWidth / 2 + 10;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Date / दिनांक:', rightColX, curY + 7);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(bill.date, rightColX + 32, curY + 7);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment Mode / माध्यम:', rightColX, curY + 14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(bill.paymentMode, rightColX + 32, curY + 14);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment Status / स्थिति:', rightColX, curY + 20);
  if (bill.balance > 0) {
    doc.setTextColor(220, 38, 38); // red-600
    doc.setFont('helvetica', 'bold');
    doc.text(`Due: INR ${bill.balance}`, rightColX + 32, curY + 20);
  } else {
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.setFont('helvetica', 'bold');
    doc.text('PAID (पूर्ण चुकता)', rightColX + 32, curY + 20);
  }

  // Items Table
  curY = 82;
  const colX = {
    sno: margin + 4,
    desc: margin + 18,
    qty: margin + contentWidth - 65,
    rate: margin + contentWidth - 40,
    amount: margin + contentWidth - 10,
  };

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY, contentWidth, 8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  doc.text('#', colX.sno, curY + 5.5);
  doc.text('Medicine / Item Description (दवा / सामग्री)', colX.desc, curY + 5.5);
  doc.text('Qty', colX.qty, curY + 5.5, { align: 'right' });
  doc.text('Rate (Rs)', colX.rate, curY + 5.5, { align: 'right' });
  doc.text('Total (Rs)', colX.amount, curY + 5.5, { align: 'right' });

  curY += 8;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  bill.items.forEach((item, index) => {
    // Alternating background
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(margin, curY, contentWidth, 7, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, curY + 7, margin + contentWidth, curY + 7);

    doc.setTextColor(71, 85, 105);
    doc.text(String(index + 1), colX.sno, curY + 5);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    // Truncate medicine name if too long
    const cleanName = item.name.length > 40 ? item.name.slice(0, 38) + '..' : item.name;
    doc.text(cleanName, colX.desc, curY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(String(item.qty), colX.qty, curY + 5, { align: 'right' });
    doc.text(item.price.toFixed(2), colX.rate, curY + 5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text((item.qty * item.price).toFixed(2), colX.amount, curY + 5, { align: 'right' });

    curY += 7;
  });

  // Table Outer Box
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, 82, contentWidth, curY - 82);

  // Summary / Calculation Box
  curY += 4;
  const summaryBoxWidth = 80;
  const summaryBoxX = margin + contentWidth - summaryBoxWidth;

  // Scan & Pay UPI Box on the left
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, curY, contentWidth - summaryBoxWidth - 8, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text('ONLINE PAYMENT / UPI DETAILS', margin + 6, curY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`UPI ID: ${CLINIC_CONFIG.upiId}`, margin + 6, curY + 16);
  doc.text('Accepted on: PhonePe / Google Pay / Paytm / BHIM', margin + 6, curY + 22);
  doc.text(`Helpline: ${CLINIC_CONFIG.phone} (Rita Clinic)`, margin + 6, curY + 28);

  // Summary table on the right
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(summaryBoxX, curY, summaryBoxWidth, 36, 2, 2, 'FD');

  let sY = curY + 7;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal (योग):', summaryBoxX + 4, sY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs ${bill.subTotal.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 4, sY, { align: 'right' });

  if (bill.discount > 0) {
    sY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.text('Discount (छूट):', summaryBoxX + 4, sY);
    doc.setFont('helvetica', 'bold');
    doc.text(`- Rs ${bill.discount.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 4, sY, { align: 'right' });
  }

  sY += 7;
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryBoxX, sY - 2, summaryBoxX + summaryBoxWidth, sY - 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 76, 58);
  doc.text('Net Total (कुल देय):', summaryBoxX + 4, sY + 2);
  doc.text(`Rs ${bill.total.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 4, sY + 2, { align: 'right' });

  sY += 8;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Paid (जमा):', summaryBoxX + 4, sY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`Rs ${bill.paid.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 4, sY, { align: 'right' });

  if (bill.balance > 0) {
    sY += 6;
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text('Balance Due (बाकी):', summaryBoxX + 4, sY);
    doc.text(`Rs ${bill.balance.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 4, sY, { align: 'right' });
  }

  // Footer & Authorized Seal
  curY += 46;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, curY, margin + contentWidth, curY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('1. Sold medicines can only be returned within 7 days in sealed pack with original bill.', margin, curY + 5);
  doc.text('2. Please consult doctor before consuming scheduled drugs.', margin, curY + 9);
  doc.text(`3. Rita Clinic Digital Portal: ${getPublicShareUrl()}`, margin, curY + 13);

  // Doctor / Counter Sign
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('For RITA CLINIC & PHARMACY', margin + contentWidth - 55, curY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Authorized Signatory / Stamp', margin + contentWidth - 55, curY + 14);

  return doc;
}

/**
 * Generates the PDF Blob and File object for a bill.
 */
export async function generateBillPdfBlob(
  bill: SaleBill
): Promise<{ blob: Blob; file: File; filename: string }> {
  const doc = generateBillPdfDoc(bill);
  const blob = doc.output('blob');
  const safeName = bill.name ? bill.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Customer';
  const filename = `RitaClinic_Bill_${bill.billNo}_${safeName}.pdf`;
  const file = new File([blob], filename, { type: 'application/pdf' });
  return { blob, file, filename };
}

/**
 * Downloads the Bill PDF directly to user's device.
 */
export async function downloadBillPdf(bill: SaleBill): Promise<string> {
  const doc = generateBillPdfDoc(bill);
  const safeName = bill.name ? bill.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Customer';
  const filename = `RitaClinic_Bill_${bill.billNo}_${safeName}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * Formats a clean, professional Hindi receipt text for WhatsApp.
 */
export function formatBillWhatsAppReceipt(bill: SaleBill): string {
  const itemsText = bill.items
    .map(
      (it, idx) =>
        `${idx + 1}. *${it.name}* (मात्रा: ${it.qty} × ₹${it.price}) = *₹${it.qty * it.price}*`
    )
    .join('\n');

  const appUrl = getPublicShareUrl();

  return (
    `🏥 *रीता क्लिनिक व मेडिकल स्टोर (Rita Clinic)*\n` +
    `डॉ. रूपेश कुमार पोद्दार (CMS & ED, EMT)\n` +
    `साइकिल चौक, मोहनपुर, मुजफ्फरपुर, बिहार | 📞 7319890286\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🧾 *दवा बिक्री रसीद (Pharmacy Cash Memo)*\n` +
    `बिल संख्या: *${bill.billNo}*\n` +
    `दिनांक: ${bill.date}\n` +
    `ग्राहक/मरीज: *${bill.name}*\n` +
    (bill.phone ? `मोबाइल: *${bill.phone}*\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📋 *दवाइयों का विवरण:*\n` +
    `${itemsText}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `कुल योग (Subtotal): ₹${bill.subTotal}\n` +
    (bill.discount > 0 ? `विशेष छूट (Discount): -₹${bill.discount}\n` : '') +
    `*अंतिम देय राशि (Net Total): ₹${bill.total}*\n` +
    `जमा राशि: ₹${bill.paid} (${bill.paymentMode})\n` +
    (bill.balance > 0
      ? `⚠️ *शेष बकाया (Balance Due): ₹${bill.balance}*\n`
      : `✅ *भुगतान स्थिति: पूर्ण चुकता (PAID)*\n`) +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📱 *ऑनलाइन भुगतान UPI:* ${CLINIC_CONFIG.upiId}\n` +
    `🌐 *क्लिनिक डिजिटल पोर्टल:* ${appUrl}\n\n` +
    `धन्यवाद! आपके शीघ्र स्वस्थ होने की कामना करते हैं।`
  );
}

/**
 * Automatically dispatches the Bill PDF and itemized receipt to the customer's WhatsApp.
 * Uses Web Share API with File when supported (directly attaches PDF on Mobile Chrome/Safari),
 * downloads the PDF, and opens WhatsApp chat with the customer number.
 */
export async function sendBillToCustomerWhatsApp(
  bill: SaleBill,
  options: { autoDownload?: boolean } = { autoDownload: true }
): Promise<{ success: boolean; method: 'web_share' | 'whatsapp_link' }> {
  const receiptText = formatBillWhatsAppReceipt(bill);
  const { file } = await generateBillPdfBlob(bill);

  // Clean phone number for WhatsApp
  let cleanPhone = (bill.phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  // 1. Try native Web Share API with files (supported on Android Chrome, Safari iOS)
  if (
    navigator.canShare &&
    navigator.canShare({ files: [file] }) &&
    navigator.share
  ) {
    try {
      await navigator.share({
        files: [file],
        title: `दवा बिल ${bill.billNo} - रीता क्लिनिक`,
        text: receiptText,
      });
      return { success: true, method: 'web_share' };
    } catch (err: any) {
      // User cancelled share or fallback needed
      if (err.name === 'AbortError') {
        return { success: false, method: 'web_share' };
      }
      console.log('Web share fallback to whatsapp link:', err);
    }
  }

  // 2. Download PDF automatically for device storage
  if (options.autoDownload) {
    try {
      await downloadBillPdf(bill);
    } catch (err) {
      console.error('PDF auto-download failed:', err);
    }
  }

  // 3. Open WhatsApp chat with prefilled itemized invoice
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(receiptText)}`
    : `https://wa.me/?text=${encodeURIComponent(receiptText)}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');
  return { success: true, method: 'whatsapp_link' };
}
