import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/integrations/supabase/client';

export class PDFGenerator {
  /**
   * Downloads a receipt image as a PDF
   * @param imagePath - The storage path to the receipt image
   * @param filename - The desired filename for the PDF
   */
  static async downloadReceiptPDF(imagePath: string, filename: string): Promise<void> {
    try {
      // Get a signed URL for the image
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('receipt-images')
        .createSignedUrl(imagePath, 300); // 5 minute expiry

      if (urlError || !signedUrlData) {
        throw new Error(`Failed to get image URL: ${urlError?.message || 'Unknown error'}`);
      }

      // Fetch the image
      const response = await fetch(signedUrlData.signedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const imageBytes = await response.arrayBuffer();
      
      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Determine image type and embed accordingly
      let image;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
        image = await pdfDoc.embedJpg(imageBytes);
      } else if (contentType.includes('image/png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        throw new Error(`Unsupported image format: ${contentType}`);
      }

      // Calculate page dimensions to fit image while maintaining aspect ratio
      const maxWidth = 595; // A4 width in points
      const maxHeight = 842; // A4 height in points
      
      const imageAspectRatio = image.width / image.height;
      let pageWidth = maxWidth;
      let pageHeight = maxHeight;
      let imageWidth = image.width;
      let imageHeight = image.height;

      // Scale image to fit page
      if (imageWidth > maxWidth || imageHeight > maxHeight) {
        if (imageAspectRatio > maxWidth / maxHeight) {
          // Image is wider relative to page
          imageWidth = maxWidth;
          imageHeight = maxWidth / imageAspectRatio;
        } else {
          // Image is taller relative to page
          imageHeight = maxHeight;
          imageWidth = maxHeight * imageAspectRatio;
        }
      }

      // Set page size to fit image
      pageWidth = Math.min(imageWidth, maxWidth);
      pageHeight = Math.min(imageHeight, maxHeight);

      // Add page and image
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      
      // Center the image on the page
      const x = (pageWidth - imageWidth) / 2;
      const y = (pageHeight - imageHeight) / 2;
      
      page.drawImage(image, {
        x: x,
        y: y,
        width: imageWidth,
        height: imageHeight,
      });

      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save();

      // Download the PDF
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  /**
   * Checks if a receipt has an associated image for PDF generation
   * @param receipt - The receipt object
   * @returns boolean indicating if PDF generation is possible
   */
  static canGeneratePDF(receipt: { image_path?: string | null }): boolean {
    return !!(receipt.image_path);
  }
}