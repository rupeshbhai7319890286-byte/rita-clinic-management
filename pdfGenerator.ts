import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates and downloads a high-resolution professional PDF from any DOM element.
 * @param elementId The DOM ID of the element to capture
 * @param filename Desired filename of the PDF
 * @param format 'a4' or 'thermal'
 */
export async function downloadElementAsPdf(
  elementId: string,
  filename: string,
  format: 'a4' | 'thermal' = 'a4'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    // Generate high resolution canvas
    const canvas = await html2canvas(element, {
      scale: 2.5, // High-DPI for crisp text and print clarity
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    if (format === 'thermal') {
      // 80mm width thermal receipt PDF
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidth, pdfHeight + 10],
      });
      pdf.addImage(imgData, 'PNG', 0, 5, pdfWidth, pdfHeight);
      pdf.save(filename);
    } else {
      // Standard A4 Medical Letterhead format
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const contentWidth = pdfWidth - 16; // 8mm margins on each side
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      if (contentHeight <= pdfHeight - 16) {
        // Fits comfortably on single A4 page
        pdf.addImage(imgData, 'PNG', 8, 8, contentWidth, contentHeight);
      } else {
        // Multi-page handling if exceptionally long
        let heightLeft = contentHeight;
        let position = 8;

        pdf.addImage(imgData, 'PNG', 8, position, contentWidth, contentHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
          position = heightLeft - contentHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 8, position, contentWidth, contentHeight);
          heightLeft -= pdfHeight;
        }
      }

      pdf.save(filename);
    }

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}

/**
 * Generates and returns a PDF Blob from a DOM element (for direct upload to Google Drive)
 */
export async function generateElementPdfBlob(
  elementId: string,
  format: 'a4' | 'thermal' = 'a4'
): Promise<Blob | null> {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pdfWidth - 16;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 8, 8, contentWidth, contentHeight);
    return pdf.output('blob');
  } catch (err) {
    console.error('Failed to generate PDF blob:', err);
    return null;
  }
}

