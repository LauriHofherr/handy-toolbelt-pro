import jsPDF from 'jspdf';
import type { Estimate, Invoice, Client, AppSettings, LineItem } from '@/types';
import { calculateSubtotal, calculateTotal, formatCurrency, formatDate } from '@/lib/utils';

function addHeader(doc: jsPDF, settings: AppSettings, title: string) {
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.businessName || 'HandyMan Pro', 20, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let y = 33;
  if (settings.businessPhone) { doc.text(settings.businessPhone, 20, y); y += 5; }
  if (settings.businessEmail) { doc.text(settings.businessEmail, 20, y); y += 5; }
  if (settings.businessAddress) { doc.text(settings.businessAddress, 20, y); y += 5; }

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 190, 25, { align: 'right' });
  return y + 5;
}

function addClientInfo(doc: jsPDF, client: Client | null | undefined, y: number) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  if (client) {
    doc.text(client.name, 20, y); y += 5;
    if (client.phone) { doc.text(client.phone, 20, y); y += 5; }
    if (client.email) { doc.text(client.email, 20, y); y += 5; }
    if (client.address) { doc.text(client.address, 20, y); y += 5; }
  }
  return y + 5;
}

function addLineItems(doc: jsPDF, items: LineItem[], taxRate: number, y: number) {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 20, y);
  doc.text('Qty', 120, y, { align: 'right' });
  doc.text('Price', 150, y, { align: 'right' });
  doc.text('Amount', 190, y, { align: 'right' });
  y += 3;
  doc.line(20, y, 190, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  items.forEach(item => {
    doc.text(item.description, 20, y);
    doc.text(String(item.quantity), 120, y, { align: 'right' });
    doc.text(formatCurrency(item.unitPrice), 150, y, { align: 'right' });
    doc.text(formatCurrency(item.quantity * item.unitPrice), 190, y, { align: 'right' });
    y += 6;
  });

  y += 3;
  doc.line(120, y, 190, y);
  y += 6;

  const subtotal = calculateSubtotal(items);
  doc.text('Subtotal', 150, y, { align: 'right' });
  doc.text(formatCurrency(subtotal), 190, y, { align: 'right' });
  y += 6;

  doc.text(`Tax (${taxRate}%)`, 150, y, { align: 'right' });
  doc.text(formatCurrency(subtotal * taxRate / 100), 190, y, { align: 'right' });
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total', 150, y, { align: 'right' });
  doc.text(formatCurrency(calculateTotal(items, taxRate)), 190, y, { align: 'right' });

  return y + 10;
}

export function generateEstimatePdf(estimate: Estimate, client: Client | null | undefined, settings: AppSettings) {
  const doc = new jsPDF();
  const hasNewFormat = (estimate.laborItems && estimate.laborItems.length > 0) || (estimate.materialItems && estimate.materialItems.length > 0);

  let y = addHeader(doc, settings, 'PROPOSAL');

  // Meta info on right side
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(estimate.createdAt)}`, 190, 35, { align: 'right' });
  doc.text(`Status: ${estimate.status.toUpperCase()}`, 190, 40, { align: 'right' });

  y = addClientInfo(doc, client, y);

  // Scope of work
  if (estimate.scopeOfWork) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Scope of Work', 20, y); y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(estimate.scopeOfWork, 170);
    doc.text(lines, 20, y);
    y += lines.length * 4 + 6;
  }

  if (hasNewFormat) {
    // LABOR TABLE
    const laborItems = estimate.laborItems || [];
    if (laborItems.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Labor', 20, y); y += 5;

      doc.setFontSize(9);
      doc.text('Description', 20, y);
      doc.text('Hours', 120, y, { align: 'right' });
      doc.text('Rate', 150, y, { align: 'right' });
      doc.text('Amount', 190, y, { align: 'right' });
      y += 3;
      doc.line(20, y, 190, y); y += 5;

      doc.setFont('helvetica', 'normal');
      let laborTotal = 0;
      laborItems.forEach(item => {
        const amt = item.hours * item.rate;
        laborTotal += amt;
        doc.text(item.description, 20, y);
        doc.text(String(item.hours), 120, y, { align: 'right' });
        doc.text(formatCurrency(item.rate) + '/hr', 150, y, { align: 'right' });
        doc.text(formatCurrency(amt), 190, y, { align: 'right' });
        y += 6;
      });
      doc.setFont('helvetica', 'bold');
      doc.text('Labor Subtotal', 150, y, { align: 'right' });
      doc.text(formatCurrency(laborTotal), 190, y, { align: 'right' });
      y += 10;
    }

    // MATERIALS TABLE
    const materialItems = estimate.materialItems || [];
    if (materialItems.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Materials & Supplies', 20, y); y += 5;

      doc.setFontSize(9);
      doc.text('Item', 20, y);
      doc.text('Qty', 110, y, { align: 'right' });
      doc.text('Unit Cost', 145, y, { align: 'right' });
      doc.text('Amount', 190, y, { align: 'right' });
      y += 3;
      doc.line(20, y, 190, y); y += 5;

      doc.setFont('helvetica', 'normal');
      let matTotal = 0;
      materialItems.forEach(item => {
        const amt = item.quantity * item.unitCost;
        matTotal += amt;
        doc.text(item.name, 20, y);
        doc.text(String(item.quantity), 110, y, { align: 'right' });
        doc.text(formatCurrency(item.unitCost), 145, y, { align: 'right' });
        doc.text(formatCurrency(amt), 190, y, { align: 'right' });
        y += 6;
      });
      doc.setFont('helvetica', 'bold');
      doc.text('Materials Subtotal', 150, y, { align: 'right' });
      doc.text(formatCurrency(matTotal), 190, y, { align: 'right' });
      y += 6;
      const markup = estimate.materialMarkup || 0;
      if (markup > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text(`Materials Markup (${markup}%)`, 150, y, { align: 'right' });
        doc.text(formatCurrency(matTotal * markup / 100), 190, y, { align: 'right' });
        y += 6;
      }
      y += 4;
    }

    // SUMMARY
    doc.line(120, y, 190, y); y += 6;
    const laborSub = laborItems.reduce((s, i) => s + i.hours * i.rate, 0);
    const matRaw = materialItems.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    const matMarkup = estimate.materialMarkup || 0;
    const matWithMarkup = matRaw * (1 + matMarkup / 100);
    const sub = laborSub + matWithMarkup;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal', 150, y, { align: 'right' });
    doc.text(formatCurrency(sub), 190, y, { align: 'right' });
    y += 6;

    if (estimate.contingencyEnabled && estimate.contingencyRate) {
      const cont = sub * (estimate.contingencyRate / 100);
      doc.text(`Project Contingency (${estimate.contingencyRate}%)`, 150, y, { align: 'right' });
      doc.text(formatCurrency(cont), 190, y, { align: 'right' });
      y += 6;
    }

    const contAmt = estimate.contingencyEnabled ? sub * ((estimate.contingencyRate || 0) / 100) : 0;
    const preTax = sub + contAmt;
    doc.text(`Tax (${estimate.taxRate}%)`, 150, y, { align: 'right' });
    doc.text(formatCurrency(preTax * estimate.taxRate / 100), 190, y, { align: 'right' });
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total', 150, y, { align: 'right' });
    doc.text(formatCurrency(preTax + preTax * estimate.taxRate / 100), 190, y, { align: 'right' });
    y += 10;
  } else {
    // Legacy format
    y = addLineItems(doc, estimate.lineItems, estimate.taxRate, y);
  }

  // Notes
  if (estimate.notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, y); y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(estimate.notes, 170);
    doc.text(lines, 20, y);
    y += lines.length * 4 + 5;
  }

  // Terms
  if (estimate.terms) {
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 20, y); y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(estimate.terms, 170);
    doc.text(lines, 20, y);
    y += lines.length * 4 + 5;
  }

  // Validity
  const validDays = settings.estimateValidityDays || 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`This estimate is valid for ${validDays} days from the date above.`, 20, y);
  y += 10;

  // Signature lines
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Accepted By:', 20, y); y += 12;
  doc.line(20, y, 100, y);
  doc.text('Signature', 20, y + 4);
  doc.line(110, y, 190, y);
  doc.text('Date', 110, y + 4);

  doc.save(`proposal-${estimate.id.slice(0, 8)}.pdf`);
}

export function generateInvoicePdf(
  invoice: Invoice,
  client: Client | null | undefined,
  settings: AppSettings,
  totalPaid: number
) {
  const doc = new jsPDF();
  let y = addHeader(doc, settings, 'INVOICE');
  doc.setFontSize(9);
  doc.text(`Date: ${formatDate(invoice.createdAt)}`, 190, 35, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 190, 40, { align: 'right' });
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 190, 45, { align: 'right' });
  y = addClientInfo(doc, client, y);
  y = addLineItems(doc, invoice.lineItems, invoice.taxRate, y);

  if (totalPaid > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Payments Received', 150, y, { align: 'right' });
    doc.text(`-${formatCurrency(totalPaid)}`, 190, y, { align: 'right' });
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Balance Due', 150, y, { align: 'right' });
    const balance = calculateTotal(invoice.lineItems, invoice.taxRate) - totalPaid;
    doc.text(formatCurrency(Math.max(0, balance)), 190, y, { align: 'right' });
  }

  doc.save(`invoice-${invoice.id.slice(0, 8)}.pdf`);
}
