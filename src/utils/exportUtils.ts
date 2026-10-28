import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Folder, Transaction, Category } from '../types';
import { formatCurrency, formatDate, getPaymentMethodLabel } from './formatters';

export function exportFolderToCSV(folder: Folder, transactions: Transaction[], categories: Category[]): void {
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'Sem categoria';
  
  const headers = ['Data', 'Descrição', 'Categoria', 'Forma de Pagamento', 'Tipo', 'Valor (R$)'];
  const rows = transactions.map(t => [
    formatDate(t.date),
    `"${t.description.replace(/"/g, '""')}"`,
    `"${getCatName(t.categoryId)}"`,
    `"${getPaymentMethodLabel(t.paymentMethod)}"`,
    t.type === 'expense' ? 'Despesa' : 'Receita',
    t.amount.toFixed(2).replace('.', ','),
  ]);

  const totalSpent = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  const csvContent = [
    `"Relatório da Pasta / Projeto: ${folder.name}"`,
    `"Meta / Teto Estipulado: ${formatCurrency(folder.targetBudget)}"`,
    `"Total Gasto: ${formatCurrency(totalSpent)}"`,
    `"Saldo Restante: ${formatCurrency(folder.targetBudget - totalSpent)}"`,
    `"Status: ${folder.status === 'active' ? 'Ativa' : 'Arquivada'}"`,
    '',
    headers.join(';'),
    ...rows.map(r => r.join(';')),
  ].join('\r\n');

  downloadFile(csvContent, `relatorio_${folder.name.toLowerCase().replace(/\s+/g, '_')}.csv`, 'text/csv;charset=utf-8;');
}

export function exportFolderToPDF(folder: Folder, transactions: Transaction[], categories: Category[]): void {
  const doc = new jsPDF();
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'Sem categoria';
  const totalSpent = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const remaining = folder.targetBudget - totalSpent;
  const percentage = folder.targetBudget > 0 ? (totalSpent / folder.targetBudget) * 100 : 0;

  // Header
  doc.setFillColor(16, 185, 129); // Emerald
  doc.rect(0, 0, 210, 24, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FinGestão • Relatório de Projeto / Pasta', 14, 16);

  // Folder Title and meta
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  doc.text(folder.name, 14, 38);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Status: ${folder.status === 'active' ? 'Ativa' : 'Arquivada/Finalizada'} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 45);

  if (folder.description) {
    doc.text(`Descrição: ${folder.description}`, 14, 51);
  }

  // Summary Box
  const startY = folder.description ? 56 : 50;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, startY, 182, 28, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startY, 182, 28, 3, 3, 'S');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Orçamento Estipulado', 22, startY + 10);
  doc.text('Total Gasto', 80, startY + 10);
  doc.text('Saldo Restante', 138, startY + 10);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(folder.targetBudget), 22, startY + 20);

  if (percentage >= 100) {
    doc.setTextColor(220, 38, 38); // Red
  } else if (percentage >= 80) {
    doc.setTextColor(217, 119, 6); // Amber
  } else {
    doc.setTextColor(16, 185, 129); // Green
  }
  doc.text(`${formatCurrency(totalSpent)} (${percentage.toFixed(1)}%)`, 80, startY + 20);

  doc.setTextColor(remaining >= 0 ? 16 : 220, remaining >= 0 ? 185 : 38, remaining >= 0 ? 129 : 38);
  doc.text(formatCurrency(remaining), 138, startY + 20);

  // Table
  const tableData = transactions.map(t => [
    formatDate(t.date),
    t.description,
    getCatName(t.categoryId),
    getPaymentMethodLabel(t.paymentMethod),
    formatCurrency(t.amount),
  ]);

  autoTable(doc, {
    startY: startY + 36,
    head: [['Data', 'Descrição', 'Categoria', 'Pagamento', 'Valor']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' },
    },
  });

  doc.save(`relatorio_${folder.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
}

export function exportMonthlyReportToCSV(
  monthStr: string,
  transactions: Transaction[],
  categories: Category[],
  folders: Folder[]
): void {
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'Sem categoria';
  const getFolderName = (id?: string | null) => {
    if (!id) return 'Sem pasta (Dia a dia)';
    return folders.find(f => f.id === id)?.name || 'Pasta removida';
  };

  const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Pasta Vinculada', 'Forma de Pagamento', 'Recorrente', 'Valor (R$)'];
  const rows = transactions.map(t => [
    formatDate(t.date),
    t.type === 'expense' ? 'Despesa' : 'Receita',
    `"${t.description.replace(/"/g, '""')}"`,
    `"${getCatName(t.categoryId)}"`,
    `"${getFolderName(t.folderId)}"`,
    `"${getPaymentMethodLabel(t.paymentMethod)}"`,
    t.isRecurring ? 'Sim' : 'Não',
    t.amount.toFixed(2).replace('.', ','),
  ]);

  const csvContent = [
    `"Extrato Financeiro Mensal: ${monthStr}"`,
    `"Exportado em: ${new Date().toLocaleDateString('pt-BR')}"`,
    '',
    headers.join(';'),
    ...rows.map(r => r.join(';')),
  ].join('\r\n');

  downloadFile(csvContent, `extrato_financeiro_${monthStr}.csv`, 'text/csv;charset=utf-8;');
}

export function exportMonthlyReportToPDF(
  monthStr: string,
  monthName: string,
  transactions: Transaction[],
  categories: Category[],
  folders: Folder[],
  totalIncome: number,
  totalExpense: number,
  folderExpense: number
): void {
  const doc = new jsPDF();
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'Sem categoria';
  const getFolderName = (id?: string | null) => (id ? folders.find(f => f.id === id)?.name || '-' : 'Geral');

  // Header
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 24, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FinGestão • Relatório Financeiro Mensal', 14, 16);

  // Month Title
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  doc.text(monthName, 14, 38);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} | Total de transações: ${transactions.length}`, 14, 45);

  // KPI Summary
  const startY = 50;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, startY, 182, 28, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startY, 182, 28, 3, 3, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Receitas', 20, startY + 10);
  doc.text('Total Despesas', 66, startY + 10);
  doc.text('Saldo Líquido', 112, startY + 10);
  doc.text('Gastos em Pastas', 156, startY + 10);

  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // Green
  doc.text(formatCurrency(totalIncome), 20, startY + 20);

  doc.setTextColor(220, 38, 38); // Red
  doc.text(formatCurrency(totalExpense), 66, startY + 20);

  const balance = totalIncome - totalExpense;
  doc.setTextColor(balance >= 0 ? 16 : 220, balance >= 0 ? 185 : 38, balance >= 0 ? 129 : 38);
  doc.text(formatCurrency(balance), 112, startY + 20);

  doc.setTextColor(59, 130, 246); // Blue
  doc.text(formatCurrency(folderExpense), 156, startY + 20);

  // Table
  const tableData = transactions.map(t => [
    formatDate(t.date),
    t.description,
    getCatName(t.categoryId),
    getFolderName(t.folderId),
    t.type === 'expense' ? `-${formatCurrency(t.amount)}` : `+${formatCurrency(t.amount)}`,
  ]);

  autoTable(doc, {
    startY: startY + 36,
    head: [['Data', 'Descrição', 'Categoria', 'Pasta / Projeto', 'Valor']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
    },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' },
    },
  });

  doc.save(`relatorio_mensal_${monthStr}.pdf`);
}

function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
