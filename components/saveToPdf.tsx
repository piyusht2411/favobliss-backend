"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function SaveToPDF({ invoiceRef }: { invoiceRef: React.RefObject<HTMLDivElement> }) {
  const handleSavePDF = async () => {
    if (!invoiceRef.current) return;

    try {
      // Capture the invoice DOM as a canvas
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Increase scale for better quality
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if the content exceeds one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF with a filename based on the invoice number
      pdf.save(`invoice-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <button
      onClick={handleSavePDF}
      className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Save to PDF
    </button>
  );
}