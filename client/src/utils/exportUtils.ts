import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import type { ChatMessage } from '../types';

export const exportToMarkdown = (messages: ChatMessage[], title: string) => {
  let content = `# ${title}\n\n`;
  messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'You' : 'DataPilot AI';
    content += `### ${role}\n${msg.content}\n\n`;
    if (msg.source) {
      content += `*Source: ${msg.source}*\n\n`;
    }
  });

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${title.replace(/\s+/g, '_')}_export.md`);
};

const stripMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1')     // Italic
    .replace(/#(.*?)\n/g, '$1\n')   // Headers
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // Links
    .replace(/`(.*?)`/g, '$1');      // Code
};

export const exportToPDF = async (messages: ChatMessage[], title: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // -- Modern Branded Header --
  doc.setFillColor(15, 12, 26); // Deep premium dark
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('DataPilot AI', margin, 28);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255, 0.4);
  doc.text('INTELLIGENT KNOWLEDGE RETRIEVAL', margin, 36);
  
  doc.setTextColor(255, 255, 255, 0.6);
  doc.text(new Date().toLocaleDateString(), pageWidth - margin - 20, 28, { align: 'right' });

  let yPos = 65;
  
  // -- Title Section --
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, margin, yPos);
  yPos += (titleLines.length * 10) + 15;

  // -- Messages --
  messages.forEach((msg, index) => {
    const isUser = msg.role === 'user';
    const roleText = isUser ? 'USER' : 'DATAPILOT AI';
    const cleanContent = stripMarkdown(msg.content);
    
    // Check if we need a new page before starting a new message
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 25;
    }

    // Role Header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isUser ? 100 : 124, 58, 237); // Brand Violet
    doc.text(roleText, margin, yPos);
    yPos += 6;

    // Content
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 45);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(cleanContent, contentWidth);
    
    // Check if lines will overflow page
    lines.forEach((line: string) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = 25;
      }
      doc.text(line, margin, yPos);
      yPos += 6.5;
    });

    // Source Info
    if (msg.source) {
      yPos += 2;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text(`Source: ${msg.source}`, margin, yPos);
      yPos += 4;
    }

    yPos += 12; // Gap between messages

    // Subtle divider
    if (index < messages.length - 1) {
      doc.setDrawColor(240, 240, 245);
      doc.line(margin, yPos - 6, pageWidth - margin, yPos - 6);
    }
  });

  // -- Footer --
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('DataPilot AI - Chat Export', margin, pageHeight - 10);
  }

  doc.save(`${title.replace(/\s+/g, '_')}_export.pdf`);
};

export const exportToDocx = async (messages: ChatMessage[], title: string) => {
  const sections = messages.map((msg) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: msg.role === 'user' ? 'YOU' : 'DATAPILOT AI',
          bold: true,
          color: '7C3AED',
          size: 24,
        }),
        new TextRun({
          text: `\n${msg.content}\n`,
          size: 22,
        }),
        msg.source ? new TextRun({
          text: `Source: ${msg.source}\n`,
          italics: true,
          color: '666666',
          size: 18,
        }) : new TextRun({ text: '' }),
      ],
      spacing: {
        after: 400,
      },
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...sections,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/\s+/g, '_')}_export.docx`);
};
