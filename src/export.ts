import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Markdownをクリップボードにコピー
 */
export async function copyMarkdown(markdown: string): Promise<void> {
  await navigator.clipboard.writeText(markdown);
}

/**
 * Markdownファイルとしてダウンロード
 */
export function downloadMarkdown(markdown: string, filename?: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `議事録_${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * PDFとしてダウンロード
 * HTML要素をキャプチャしてPDF化
 */
export async function downloadPDF(element: HTMLElement, filename?: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename || `議事録_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * DOCXとしてダウンロード
 * Markdownを簡易パース
 */
export async function downloadDOCX(markdown: string, filename?: string): Promise<void> {
  const lines = markdown.split('\n');
  const children: Paragraph[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      // H2
      children.push(
        new Paragraph({
          text: line.replace('## ', ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (line.startsWith('### ')) {
      // H3
      children.push(
        new Paragraph({
          text: line.replace('### ', ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 180, after: 100 },
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // リスト項目
      children.push(
        new Paragraph({
          text: line.replace(/^[*-] /, ''),
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 },
        })
      );
    } else if (line.trim() !== '') {
      // 通常のテキスト
      children.push(
        new Paragraph({
          children: [new TextRun(line)],
          spacing: { before: 60, after: 60 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename || `議事録_${new Date().toISOString().slice(0, 10)}.docx`);
}
