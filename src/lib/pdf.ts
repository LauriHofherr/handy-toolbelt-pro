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
  let y = addHeader(doc, settings, 'ESTIMATE');
  doc.setFontSize(9);
  doc.text(`Date: ${formatDate(estimate.createdAt)}`, 190, 35, { align: 'right' });
  doc.text(`Status: ${estimate.status.toUpperCase()}`, 190, 40, { align: 'right' });
  y = addClientInfo(doc, client, y);
  y = addLineItems(doc, estimate.lineItems, estimate.taxRate, y);

  if (estimate.notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, y); y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(estimate.notes, 170);
    doc.text(lines, 20, y);
    y += lines.length * 4 + 5;
  }

  if (estimate.terms) {
    doc.setFont('helvetica', 'bold');
    doc.text('Terms:', 20, y); y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(estimate.terms, 170);
    doc.text(lines, 20, y);
  }

  doc.save(`estimate-${estimate.id.slice(0, 8)}.pdf`);
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
