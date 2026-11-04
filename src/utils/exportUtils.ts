/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Teacher, FinancialTransaction } from '../types';
import { generateAcademicReportPDF, generateFinancialReportPDF, generateServicesCatalogPDF, generateTeachersRosterPDF } from './pdfGenerator';

export interface CSVHeader<T> {
  label: string;
  key: keyof T | ((item: T) => string);
}

/**
 * Helper to export list of generic items to CSV format
 */
export function exportToCSV<T>(
  data: T[],
  headers: CSVHeader<T>[],
  filename: string
) {
  // Use UTF-8 BOM so Excel opens Spanish accents correctly
  let csvContent = '\uFEFF';
  
  // Header row
  const headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');
  csvContent += headerRow + '\r\n';
  
  // Data rows
  data.forEach(item => {
    const row = headers.map(h => {
      let val = '';
      if (typeof h.key === 'function') {
        val = h.key(item);
      } else {
        const rawVal = item[h.key];
        val = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
      }
      // Escape double quotes
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
    csvContent += row + '\r\n';
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper to export students list to formatted downloadable PDF using jsPDF
 */
export function exportStudentsToPDF(students: Student[], schoolName: string = "Colegio EnlaceC") {
  return generateAcademicReportPDF(students, [], [], schoolName, true);
}

/**
 * Helper to export transactions list to formatted downloadable PDF using jsPDF
 */
export function exportTransactionsToPDF(
  transactions: FinancialTransaction[], 
  schoolName: string = "Colegio EnlaceC",
  activeTeacherName?: string
) {
  return generateFinancialReportPDF(transactions, schoolName, activeTeacherName, true);
}

/**
 * Helper to export services and courses catalog in formatted PDF
 */
export function exportServicesCatalogToPDF(
  servicios: any[],
  cursos: any[],
  servicioCursos: any[],
  teachers: any[] = [],
  servicioProfesores: any[] = [],
  schoolName: string = "Academia EnlaceC"
) {
  return generateServicesCatalogPDF(servicios, cursos, servicioCursos, teachers, servicioProfesores, schoolName, true);
}

/**
 * Helper to export teachers list to formatted downloadable PDF
 */
export function exportTeachersToPDF(
  teachers: Teacher[],
  schoolName: string = "Colegio EnlaceC"
) {
  return generateTeachersRosterPDF(teachers, schoolName, true);
}
