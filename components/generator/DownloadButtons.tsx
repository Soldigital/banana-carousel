"use client";

import * as React from "react";
import { FileText, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { composeFullExport, slugify } from "@/lib/export/compose-carousel";
import type { CarouselOutput } from "@/types/carousel";

export function DownloadButtons({ output }: { output: CarouselOutput }) {
  const [pdfBusy, setPdfBusy] = React.useState(false);

  function downloadTxt() {
    const content = composeFullExport(output);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, `${slugify(output.carousel_title)}.txt`);
    toast.success("File .txt terunduh.");
  }

  async function downloadPdf() {
    setPdfBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const marginX = 40;
      const marginY = 48;
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const maxW = pageW - marginX * 2;
      const lineH = 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const content = composeFullExport(output);
      const lines = doc.splitTextToSize(content, maxW) as string[];

      let y = marginY;
      for (const line of lines) {
        if (y > pageH - marginY) {
          doc.addPage();
          y = marginY;
        }
        doc.text(line, marginX, y);
        y += lineH;
      }

      doc.save(`${slugify(output.carousel_title)}.pdf`);
      toast.success("File .pdf terunduh.");
    } catch (err) {
      console.error("[PDF] gagal:", err);
      toast.error("Gagal membuat PDF. Coba lagi.");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={downloadTxt}>
        <FileText className="size-4" />
        .txt
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={downloadPdf}
        disabled={pdfBusy}
      >
        <FileDown className="size-4" />
        {pdfBusy ? "..." : ".pdf"}
      </Button>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
