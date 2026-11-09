import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  WidthType,
  BorderStyle,
  AlignmentType,
  Packer,
  ShadingType,
  ImageRun,
} from 'docx';
import { saveAs } from 'file-saver';
import { Report, EvidenceItem } from '../types';

/**
 * Helper: Convert base64 data URL or string to Uint8Array safely
 */
function base64ToUint8Array(base64OrDataUrl: string): Uint8Array | null {
  try {
    const commaIdx = base64OrDataUrl.indexOf(',');
    const base64 = (commaIdx !== -1 ? base64OrDataUrl.slice(commaIdx + 1) : base64OrDataUrl).replace(/\s/g, '');
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error('Failed to convert base64 to Uint8Array:', e);
    return null;
  }
}

/**
 * Helper: Fetch remote image URL and return Uint8Array
 */
async function fetchImageAsUint8Array(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (e) {
    console.error('Failed to fetch image:', e);
    return null;
  }
}

/**
 * Helper: Measure image aspect ratio to fit standard A4 printable width
 */
function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ width: 520, height: 320 });
      return;
    }
    const img = new Image();
    img.onload = () => {
      const maxWidth = 550;
      const maxHeight = 380;
      let w = img.naturalWidth || 520;
      let h = img.naturalHeight || 320;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      if (h > maxHeight) {
        w = Math.round((w * maxHeight) / h);
        h = maxHeight;
      }
      resolve({ width: Math.max(w, 100), height: Math.max(h, 60) });
    };
    img.onerror = () => resolve({ width: 520, height: 320 });
    img.src = src;
  });
}

export const exportService = {
  /**
   * High-Precision PDF Export:
   * Captures each authentic A4 page cleanly without text truncation or awkward splitting,
   * compiles them 1:1 onto standard A4 PDF pages, and downloads the PDF directly.
   */
  async exportReportToPDF(elementId: string, filename: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id ${elementId} not found, falling back to print.`);
      window.print();
      return;
    }

    try {
      const originalScrollY = window.scrollY;
      window.scrollTo(0, 0);

      // Check if document has dedicated A4 pages
      const pageElements = Array.from(element.querySelectorAll<HTMLElement>('.a4-page'));

      if (pageElements.length > 0) {
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });

        for (let i = 0; i < pageElements.length; i++) {
          const pageEl = pageElements[i];
          if (i > 0) {
            pdf.addPage();
          }

          const canvas = await html2canvas(pageEl, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1024,
            ignoreElements: (element) =>
              element.classList?.contains('print-hide') ||
              element.classList?.contains('print:hidden') ||
              element.getAttribute('data-html2canvas-ignore') === 'true',
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          // Standard A4 dimensions: 210mm x 297mm
          const imgHeightMm = Math.min((canvas.height * 210) / canvas.width, 297);
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, imgHeightMm, undefined, 'FAST');
        }

        window.scrollTo(0, originalScrollY);
        pdf.save(`${filename}.pdf`);
        return;
      }

      // Fallback for single container elements
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (node) =>
          node.classList?.contains('print-hide') ||
          node.classList?.contains('print:hidden') ||
          node.getAttribute('data-html2canvas-ignore') === 'true',
      });

      window.scrollTo(0, originalScrollY);

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const marginX = 10;
      const marginTop = 12;
      const marginBottom = 12;

      const contentWidth = pdfWidth - marginX * 2;
      const contentHeight = pdfHeight - (marginTop + marginBottom);

      const scaleRatio = contentWidth / canvas.width;
      const pageHeightInCanvasPx = Math.floor(contentHeight / scaleRatio);

      const totalCanvasHeight = canvas.height;
      const totalPages = Math.ceil(totalCanvasHeight / pageHeightInCanvasPx);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        const sourceY = page * pageHeightInCanvasPx;
        const sourceHeight = Math.min(pageHeightInCanvasPx, totalCanvasHeight - sourceY);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageHeightInCanvasPx;
        const pageCtx = pageCanvas.getContext('2d');

        if (pageCtx) {
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageHeightInCanvasPx);
          pageCtx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sourceHeight,
            0,
            0,
            canvas.width,
            sourceHeight
          );

          const sliceDataUrl = pageCanvas.toDataURL('image/jpeg', 0.95);
          const sliceHeightMm = sourceHeight * scaleRatio;
          pdf.addImage(sliceDataUrl, 'JPEG', marginX, marginTop, contentWidth, sliceHeightMm);
        }
      }

      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.error('Error generating PDF with html2canvas:', err);
      window.print();
    }
  },

  /**
   * Professional Word (.docx) Export:
   * Generates a fully-styled, aligned Word document matching the PDF layout:
   * - No "SECURESHIELD CYBER LABS"
   * - Crisp table column alignments without jagged or stepped headers (exact twips)
   * - Proof of Concept screenshots and evidence images embedded via ImageRun
   * - Status notes excluded in export (matching PDF)
   * - "Informational" streamlined to "Info"
   */
  async exportReportToWord(report: Report): Promise<void> {
    try {
      const severityCounts = {
        Critical: report.vulnerabilities.filter((v) => v.severity === 'Critical').length,
        High: report.vulnerabilities.filter((v) => v.severity === 'High').length,
        Medium: report.vulnerabilities.filter((v) => v.severity === 'Medium').length,
        Low: report.vulnerabilities.filter((v) => v.severity === 'Low').length,
        Info: report.vulnerabilities.filter((v) => v.severity === 'Info' || v.severity === 'Informational').length,
      };

      const cellBorderThin = {
        style: BorderStyle.SINGLE,
        size: 1,
        color: 'CBD5E1',
      };

      const standardBorders = {
        top: cellBorderThin,
        bottom: cellBorderThin,
        left: cellBorderThin,
        right: cellBorderThin,
      };

      const cellPadding = {
        top: 100,
        bottom: 100,
        left: 140,
        right: 140,
      };

      const getSeverityColor = (sev: string): { bg: string; text: string } => {
        switch (sev) {
          case 'Critical':
            return { bg: 'FEE2E2', text: '991B1B' };
          case 'High':
            return { bg: 'FEF2F2', text: 'DC2626' };
          case 'Medium':
            return { bg: 'FEF3C7', text: 'D97706' };
          case 'Low':
            return { bg: 'DCFCE7', text: '16A34A' };
          case 'Info':
          case 'Informational':
            return { bg: 'DBEAFE', text: '2563EB' };
          default:
            return { bg: 'F1F5F9', text: '475569' };
        }
      };

      // Pre-process evidence images asynchronously before assembling the docx
      const processedVulnEvidence = await Promise.all(
        report.vulnerabilities.map(async (v) => {
          const items: Array<{
            ev: EvidenceItem;
            isImage: boolean;
            imageBytes: Uint8Array | null;
            dim: { width: number; height: number };
          }> = [];

          if (v.evidence && v.evidence.length > 0) {
            for (const ev of v.evidence) {
              const isImage =
                ev.type === 'screenshot' ||
                ev.content.startsWith('data:image/') ||
                /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(ev.content);

              let bytes: Uint8Array | null = null;
              let dim = { width: 520, height: 320 };

              if (isImage) {
                if (ev.content.startsWith('data:image/')) {
                  bytes = base64ToUint8Array(ev.content);
                  dim = await getImageDimensions(ev.content);
                } else if (ev.content.startsWith('http://') || ev.content.startsWith('https://')) {
                  bytes = await fetchImageAsUint8Array(ev.content);
                  dim = await getImageDimensions(ev.content);
                }
              }

              items.push({
                ev,
                isImage,
                imageBytes: bytes,
                dim,
              });
            }
          }
          return { vulnId: v.id, items };
        })
      );

      const evidenceMap = new Map<string, typeof processedVulnEvidence[0]['items']>();
      processedVulnEvidence.forEach((item) => {
        evidenceMap.set(item.vulnId, item.items);
      });

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'Arial',
                size: 20, // 10pt
                color: '1E293B',
              },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                size: { width: 11906, height: 16838 }, // A4 standard (210mm x 297mm)
                margin: {
                  top: 1440, // 1 inch = 1440 twips
                  bottom: 1440,
                  left: 1440,
                  right: 1440,
                },
              },
            },
            children: [
              // Cover Document Title (SECURESHIELD CYBER LABS removed as requested)
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Vulnerability Assessment & Penetration Testing (VAPT) Report',
                    bold: true,
                    size: 26,
                    color: '0F172A',
                    font: 'Calibri',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.name,
                    bold: true,
                    size: 22,
                    color: '4C1D95',
                    font: 'Calibri',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Target Application: ${report.applicationName || report.projectName || 'Platform'}  |  Client: ${report.client || 'Client'}  |  Version: ${report.reportVersion || 'v1.0'}`,
                    size: 18,
                    color: '64748B',
                    font: 'Calibri',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 350 },
              }),

              // 1. Document Information
              new Paragraph({
                children: [
                  new TextRun({
                    text: '1. Document Information',
                    bold: true,
                    size: 24,
                    color: '0F172A',
                    font: 'Calibri',
                  }),
                ],
                spacing: { before: 180, after: 120 },
              }),

              new Table({
                width: { size: 9020, type: WidthType.DXA },
                columnWidths: [2700, 6320],
                alignment: AlignmentType.CENTER,
                borders: standardBorders,
                rows: [
                  new TableRow({
                    tableHeader: true,
                    cantSplit: true,
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'Parameter', bold: true, color: '334155' })] })],
                        width: { size: 2700, type: WidthType.DXA },
                        shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
                        margins: cellPadding,
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'Assessment Details', bold: true, color: '334155' })] })],
                        width: { size: 6320, type: WidthType.DXA },
                        shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
                        margins: cellPadding,
                      }),
                    ],
                  }),
                  ...[
                    ['Organization / Client', report.client],
                    ['Application Name', report.applicationName],
                    ['Application URL / Scope', report.applicationUrl],
                    ['Assessment Type', report.assessmentType],
                    ['Environment', report.environment],
                    ['Assessment Period', report.assessmentPeriod || report.assessmentDate],
                    ['Prepared By', report.preparedBy],
                  ].map(
                    ([param, val], idx) =>
                      new TableRow({
                        cantSplit: true,
                        children: [
                          new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: param, bold: true, size: 19 })] })],
                            width: { size: 2700, type: WidthType.DXA },
                            shading: idx % 2 === 0 ? { type: ShadingType.CLEAR, fill: 'F8FAFC' } : undefined,
                            margins: cellPadding,
                          }),
                          new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: val || 'N/A', size: 19 })] })],
                            width: { size: 6320, type: WidthType.DXA },
                            shading: idx % 2 === 0 ? { type: ShadingType.CLEAR, fill: 'F8FAFC' } : undefined,
                            margins: cellPadding,
                          }),
                        ],
                      })
                  ),
                ],
              }),

              // 2. Executive Summary
              new Paragraph({
                children: [
                  new TextRun({
                    text: '2. Executive Summary',
                    bold: true,
                    size: 24,
                    color: '0F172A',
                    font: 'Calibri',
                  }),
                ],
                spacing: { before: 300, after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.executiveSummary ||
                      'A comprehensive Vulnerability Assessment and Penetration Testing (VAPT) exercise was conducted against the target environment. The primary objective was to assess the defense posture of the application, identify exploitable security vulnerabilities, and evaluate compliance with OWASP Top 10 guidelines.',
                    size: 20,
                    font: 'Calibri',
                    color: '334155',
                  }),
                ],
                spacing: { after: 200 },
              }),

              // 3. Summary of Findings
              new Paragraph({
                children: [
                  new TextRun({
                    text: '3. Summary of Findings',
                    bold: true,
                    size: 24,
                    color: '0F172A',
                    font: 'Calibri',
                  }),
                ],
                spacing: { before: 260, after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `The Vulnerability Assessment and Penetration Testing (VAPT) conducted for the target organization yielded important findings and insights. It was observed that the application was exposed to a total of ${report.vulnerabilities.length} security vulnerabilities during the given assessment tenure with ${severityCounts.Critical} as Critical, ${severityCounts.High} as High, ${severityCounts.Medium} as Medium, ${severityCounts.Low} as Low, and ${severityCounts.Info} as Info Severity vulnerabilities.`,
                    size: 20,
                    font: 'Calibri',
                    color: '334155',
                  }),
                ],
                spacing: { after: 180 },
              }),

              // Aligned Findings Table (Widths in exact DXA twips matching columns)
              new Table({
                width: { size: 9020, type: WidthType.DXA },
                columnWidths: [800, 4220, 1330, 1330, 1340],
                alignment: AlignmentType.CENTER,
                borders: standardBorders,
                rows: [
                  new TableRow({
                    tableHeader: true,
                    cantSplit: true,
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'S. No.', bold: true, color: '1E1B4B' })], alignment: AlignmentType.CENTER })],
                        width: { size: 800, type: WidthType.DXA },
                        shading: { type: ShadingType.CLEAR, fill: 'EDE9FE' },
                        margins: cellPadding,
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'Vulnerability Name', bold: true, color: '1E1B4B' })] })],
                        width: { size: 4220, type: WidthType.DXA },
                        shading: { type: ShadingType.CLEAR, fill: 'EDE9FE' },
                        margins: cellPadding,
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'Severity', bold: true, color: '1E1B4B' })], alignment: AlignmentType.CENTER })],
                        width: { size: 1330, type: WidthType.DXA },
                        shading: { type: ShadingType.CLEAR, fill: 'EDE9FE' },
                        margins: cellPadding,
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'Risk Score', bold: true, color: '1E1B4B' })], alignment: AlignmentType.CENTER })],
                        width: { size: 1330, type: WidthType.DXA },
                        shading: { type: ShadingType.CLEAR, fill: 'EDE9FE' },
                        margins: cellPadding,
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, color: '1E1B4B' })], alignment: AlignmentType.CENTER })],
                        width: { size: 1340, type: WidthType.DXA },
                        shading: { type: ShadingType.CLEAR, fill: 'EDE9FE' },
                        margins: cellPadding,
                      }),
                    ],
                  }),
                  ...report.vulnerabilities.map((v, i) => {
                    const sevColor = getSeverityColor(v.severity);
                    const isInfo = v.severity === 'Informational' || v.severity === 'Info';
                    return new TableRow({
                      cantSplit: true,
                      children: [
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: `${i + 1}`, bold: true })], alignment: AlignmentType.CENTER })],
                          width: { size: 800, type: WidthType.DXA },
                          margins: cellPadding,
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: v.name, bold: true })] })],
                          width: { size: 4220, type: WidthType.DXA },
                          margins: cellPadding,
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [new TextRun({ text: isInfo ? 'Info' : v.severity, bold: true, color: sevColor.text })],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          width: { size: 1330, type: WidthType.DXA },
                          shading: { type: ShadingType.CLEAR, fill: sevColor.bg },
                          margins: cellPadding,
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [new TextRun({ text: v.cvssScore > 0 ? v.cvssScore.toFixed(1) : '0.0', bold: true })],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          width: { size: 1330, type: WidthType.DXA },
                          margins: cellPadding,
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [new TextRun({ text: v.status.toUpperCase(), bold: true, size: 18 })],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          width: { size: 1340, type: WidthType.DXA },
                          margins: cellPadding,
                        }),
                      ],
                    });
                  }),
                ],
              }),

              // Finding Status Definitions Table
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Finding Status Definitions',
                    bold: true,
                    size: 20,
                    color: '0F172A',
                    font: 'Calibri',
                  }),
                ],
                spacing: { before: 260, after: 100 },
              }),
              new Table({
                width: { size: 9020, type: WidthType.DXA },
                columnWidths: [2500, 6520],
                alignment: AlignmentType.CENTER,
                borders: standardBorders,
                rows: [
                  new TableRow({
                    tableHeader: true,
                    cantSplit: true,
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })],
                        width: { size: 2500, type: WidthType.DXA },
                        shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
                        margins: cellPadding,
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'Meaning', bold: true })] })],
                        width: { size: 6520, type: WidthType.DXA },
                        shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
                        margins: cellPadding,
                      }),
                    ],
                  }),
                  ...[
                    { status: 'Open', meaning: 'Finding is confirmed and remediation is pending.' },
                    { status: 'Fixed', meaning: 'Remediation has been implemented and verified during retesting.' },
                    { status: 'Partially Fixed', meaning: 'Some but not all aspects of the finding have been resolved.' },
                    { status: 'Risk Accepted', meaning: 'An authorized risk owner has formally accepted the documented residual risk.' },
                    { status: 'Not Reproducible', meaning: 'The original issue could not be reproduced under the retest conditions.' },
                  ].map(
                    (row) =>
                      new TableRow({
                        cantSplit: true,
                        children: [
                          new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: row.status, bold: true })] })],
                            width: { size: 2500, type: WidthType.DXA },
                            margins: cellPadding,
                          }),
                          new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: row.meaning, size: 18 })] })],
                            width: { size: 6520, type: WidthType.DXA },
                            margins: cellPadding,
                          }),
                        ],
                      })
                  ),
                ],
              }),

              // 4. Detailed Findings Section
              new Paragraph({
                children: [
                  new TextRun({
                    text: '4. Detailed Vulnerability Findings',
                    bold: true,
                    size: 24,
                    color: '0F172A',
                    font: 'Calibri',
                  }),
                ],
                spacing: { before: 380, after: 180 },
              }),

              ...report.vulnerabilities.flatMap((vuln, index) => {
                const isInfo = vuln.severity === 'Informational' || vuln.severity === 'Info';
                const evidenceItems = evidenceMap.get(vuln.id) || [];

                return [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${index + 1}. ${vuln.name}`,
                        bold: true,
                        size: 22,
                        color: '4C1D95',
                        font: 'Calibri',
                      }),
                    ],
                    spacing: { before: 240, after: 100 },
                  }),

                  // Severity and CVSS table box (aligned columns)
                  new Table({
                    width: { size: 9020, type: WidthType.DXA },
                    columnWidths: [3200, 5820],
                    alignment: AlignmentType.CENTER,
                    borders: standardBorders,
                    rows: [
                      new TableRow({
                        cantSplit: true,
                        children: [
                          new TableCell({
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({ text: 'Severity: ', bold: true }),
                                  new TextRun({ text: `${isInfo ? 'Info' : vuln.severity} (${vuln.cvssScore > 0 ? vuln.cvssScore.toFixed(1) : '0.0'})`, bold: true }),
                                ],
                              }),
                            ],
                            width: { size: 3200, type: WidthType.DXA },
                            margins: cellPadding,
                            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
                          }),
                          new TableCell({
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({ text: 'CVSS v3.1 Vector: ', bold: true }),
                                  new TextRun({ text: vuln.cvssVector, font: 'Consolas', size: 18 }),
                                ],
                              }),
                            ],
                            width: { size: 5820, type: WidthType.DXA },
                            margins: cellPadding,
                            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
                          }),
                        ],
                      }),
                      new TableRow({
                        cantSplit: true,
                        children: [
                          new TableCell({
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({ text: 'Affected Endpoint: ', bold: true }),
                                  new TextRun({ text: vuln.endpoint, font: 'Consolas', size: 18 }),
                                  new TextRun({ text: ` [${(vuln.endpointStatus || 'OPEN').toUpperCase()}]`, bold: true }),
                                ],
                              }),
                            ],
                            columnSpan: 2,
                            width: { size: 9020, type: WidthType.DXA },
                            margins: cellPadding,
                          }),
                        ],
                      }),
                    ],
                  }),

                  // Description
                  new Paragraph({
                    children: [new TextRun({ text: 'Description:', bold: true, size: 20, color: '334155' })],
                    spacing: { before: 140, after: 60 },
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: vuln.description || 'N/A', size: 19 })],
                    spacing: { after: 140 },
                  }),

                  // Impact
                  new Paragraph({
                    children: [new TextRun({ text: 'Impact:', bold: true, size: 20, color: '991B1B' })],
                    spacing: { before: 100, after: 60 },
                  }),
                  ...(vuln.impact && vuln.impact.length > 0 && vuln.impact[0]
                    ? vuln.impact.map(
                        (imp) =>
                          new Paragraph({
                            children: [new TextRun({ text: `• ${imp}`, size: 19 })],
                            spacing: { after: 40 },
                          })
                      )
                    : [new Paragraph({ children: [new TextRun({ text: '• None documented', size: 19 })], spacing: { after: 40 } })]),

                  // Recommendations
                  new Paragraph({
                    children: [new TextRun({ text: 'Recommendations:', bold: true, size: 20, color: '166534' })],
                    spacing: { before: 140, after: 60 },
                  }),
                  ...(vuln.recommendations && vuln.recommendations.length > 0 && vuln.recommendations[0]
                    ? vuln.recommendations.map(
                        (rec) =>
                          new Paragraph({
                            children: [new TextRun({ text: `• ${rec}`, size: 19 })],
                            spacing: { after: 40 },
                          })
                      )
                    : [new Paragraph({ children: [new TextRun({ text: '• None documented', size: 19 })], spacing: { after: 40 } })]),

                  // Proof of Concept (POC) - only render if there are preconditions, steps, evidence references, or evidence items
                  ...((vuln.preconditions && vuln.preconditions.trim()) ||
                  (vuln.stepsToReproduce && vuln.stepsToReproduce.trim()) ||
                  (vuln.evidenceReferences && vuln.evidenceReferences.trim()) ||
                  evidenceItems.length > 0
                    ? [
                        new Paragraph({
                          children: [new TextRun({ text: 'Proof of Concept (POC):', bold: true, size: 20, color: '0F172A' })],
                          spacing: { before: 140, after: 60 },
                        }),
                        ...(vuln.preconditions && vuln.preconditions.trim()
                          ? [
                              new Paragraph({
                                children: [
                                  new TextRun({ text: 'Preconditions: ', bold: true }),
                                  new TextRun({ text: vuln.preconditions, size: 19 }),
                                ],
                                spacing: { after: 60 },
                              }),
                            ]
                          : []),
                        ...(vuln.stepsToReproduce && vuln.stepsToReproduce.trim()
                          ? [
                              new Paragraph({
                                children: [new TextRun({ text: 'Reproduction steps:', bold: true })],
                                spacing: { after: 40 },
                              }),
                              new Paragraph({
                                children: [new TextRun({ text: vuln.stepsToReproduce, size: 18 })],
                                spacing: { after: 60 },
                              }),
                            ]
                          : []),
                        ...(vuln.evidenceReferences && vuln.evidenceReferences.trim()
                          ? [
                              new Paragraph({
                                children: [
                                  new TextRun({ text: 'Evidence references: ', bold: true }),
                                  new TextRun({ text: vuln.evidenceReferences, size: 18 }),
                                ],
                                spacing: { after: 100 },
                              }),
                            ]
                          : []),
                      ]
                    : []),

                  // Embedded Proof of Concept Evidence Attachments (Real Images & Code Blocks)
                  ...evidenceItems.flatMap((item) => {
                    if (item.isImage && item.imageBytes) {
                      return [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `Evidence: ${item.ev.title} (Screenshot)`,
                              bold: true,
                              italics: true,
                              size: 19,
                              color: '1E293B',
                            }),
                            ...(item.ev.description
                              ? [new TextRun({ text: ` — ${item.ev.description}`, size: 17, color: '64748B' })]
                              : []),
                          ],
                          spacing: { before: 120, after: 60 },
                        }),
                        new Paragraph({
                          children: [
                            new ImageRun({
                              data: item.imageBytes,
                              transformation: {
                                width: item.dim.width,
                                height: item.dim.height,
                              },
                              altText: {
                                title: item.ev.title,
                                description: item.ev.description || item.ev.title,
                                name: item.ev.title,
                              },
                            }),
                          ],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 140 },
                        }),
                      ];
                    }

                    // Text, HTTP Request or Response Evidence
                    return [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Evidence: ${item.ev.title} (${item.ev.type.replace('_', ' ')})`,
                            bold: true,
                            italics: true,
                            size: 19,
                            color: '1E293B',
                          }),
                          ...(item.ev.description
                            ? [new TextRun({ text: ` — ${item.ev.description}`, size: 17, color: '64748B' })]
                            : []),
                        ],
                        spacing: { before: 120, after: 60 },
                      }),
                      new Table({
                        width: { size: 9020, type: WidthType.DXA },
                        columnWidths: [9020],
                        alignment: AlignmentType.CENTER,
                        borders: standardBorders,
                        rows: [
                          new TableRow({
                            cantSplit: true,
                            children: [
                              new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: item.ev.content, font: 'Consolas', size: 17, color: 'F8FAFC' })] })],
                                width: { size: 9020, type: WidthType.DXA },
                                shading: { type: ShadingType.CLEAR, fill: '0F172A' },
                                margins: cellPadding,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ];
                  }),

                  // Retest Notes / Session (Only if retested)
                  ...((vuln.isRetested || (vuln.retestNotes && vuln.retestNotes.trim()))
                    ? [
                        new Paragraph({
                          children: [new TextRun({ text: `Retest Notes / Session (${vuln.retestedDate || 'Retested'}):`, bold: true, size: 19, color: '166534' })],
                          spacing: { before: 100, after: 40 },
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: vuln.retestNotes || '',
                              size: 18,
                              color: '1E293B',
                            }),
                          ],
                          spacing: { after: 120 },
                        }),
                      ]
                    : []),

                  new Paragraph({
                    text: '_________________________________________________________________________________',
                    spacing: { before: 150, after: 250 },
                  }),
                ];
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${report.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_VAPT_Report.docx`);
    } catch (e) {
      console.error('Error generating Word docx:', e);
      alert('Unable to generate Word document. Please check console.');
    }
  },

  /**
   * Professional Excel / CSV Export:
   * Generates a clean, UTF-8 encoded spreadsheet of all assessment vulnerabilities
   * compatible with Microsoft Excel, Google Sheets, and LibreOffice Calc.
   */
  exportReportToExcel(report: Report): void {
    const headers = [
      'S. No.',
      'Finding ID',
      'Vulnerability Name',
      'Severity',
      'CVSS Score',
      'CVSS Vector',
      'Affected Endpoint',
      'Endpoint Status',
      'Status',
      'Description',
      'Impact',
      'Recommendations',
    ];

    const escapeCsv = (val: any): string => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = report.vulnerabilities.map((v, idx) => {
      const isInfo = v.severity === 'Informational' || v.severity === 'Info';
      return [
        idx + 1,
        v.id,
        v.name,
        isInfo ? 'Info' : v.severity,
        v.cvssScore > 0 ? v.cvssScore.toFixed(1) : '0.0',
        v.cvssVector || 'N/A',
        v.endpoint || 'N/A',
        (v.endpointStatus || 'OPEN').toUpperCase(),
        v.status,
        v.description || '',
        (v.impact || []).join('; '),
        (v.recommendations || []).join('; '),
      ]
        .map(escapeCsv)
        .join(',');
    });

    // \uFEFF ensures UTF-8 BOM so Excel opens it with proper formatting and columns
    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${report.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_VAPT_Findings.csv`);
  },
};
