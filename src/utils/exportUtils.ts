/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, FinancialTransaction } from '../types';

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
 * Helper to export students list to formatted printable PDF
 */
export function exportStudentsToPDF(students: Student[], schoolName: string = "Colegio Tesla") {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permita las ventanas emergentes (popups) para poder descargar el PDF.');
    return;
  }

  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const rowsHtml = students.map((s, index) => `
    <tr style="border-bottom: 1px solid #e4e4e7;">
      <td style="padding: 10px 12px; font-weight: bold; color: #71717a;">EST-${String(index + 1).padStart(3, '0')}</td>
      <td style="padding: 10px 12px; font-weight: 600; color: #18181b;">${s.name || `${s.nombre || ''} ${s.apellido || ''}`.trim() || 'Estudiante'}</td>
      <td style="padding: 10px 12px; color: #27272a;">${s.email || '-'}</td>
      <td style="padding: 10px 12px; color: #27272a;">${s.grade || `${s.grado || ''}° Grado ${s.nivel || ''}`.trim() || 'No asignado'} ${s.section ? `Secc. ${s.section}` : ''}</td>
      <td style="padding: 10px 12px; color: #27272a;">${s.parentName || '-'}</td>
      <td style="padding: 10px 12px; font-family: monospace; color: #27272a;">${s.parentPhone || s.contacto || '-'}</td>
      <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: ${(s.balance || 0) > 0 ? '#dc2626' : '#16a34a'};">
        ${(s.balance || 0) > 0 ? `$${(s.balance || 0).toLocaleString('es-ES')} USD` : 'Al día'}
      </td>
    </tr>
  `).join('');

  const totalDeuda = students.reduce((acc, curr) => acc + (curr.balance || 0), 0);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Estudiantes - ${schoolName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #1c1917;
          margin: 40px;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #e4e4e7;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .school-info h1 {
          font-size: 20px;
          font-weight: 800;
          color: #4f46e5;
          margin: 0 0 4px 0;
          letter-spacing: -0.025em;
        }
        .school-info p {
          font-size: 11px;
          color: #71717a;
          margin: 0;
          font-weight: 500;
        }
        .report-title {
          text-align: right;
        }
        .report-title h2 {
          font-size: 18px;
          font-weight: 700;
          color: #18181b;
          margin: 0 0 6px 0;
        }
        .report-title p {
          font-size: 11px;
          color: #71717a;
          margin: 0;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          background-color: #f4f4f5;
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 30px;
        }
        .meta-card h4 {
          font-size: 9px;
          text-transform: uppercase;
          color: #71717a;
          margin: 0 0 4px 0;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .meta-card p {
          font-size: 14px;
          font-weight: 700;
          color: #18181b;
          margin: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 30px;
        }
        th {
          background-color: #fafafa;
          color: #71717a;
          text-transform: uppercase;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 10px 12px;
          text-align: left;
          border-bottom: 2px solid #e4e4e7;
        }
        .footer {
          position: fixed;
          bottom: 20px;
          left: 40px;
          right: 40px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #a1a1aa;
          border-top: 1px solid #f4f4f5;
          padding-top: 10px;
        }
        @media print {
          body { margin: 20px; }
          .no-print { display: none; }
          .footer { position: fixed; bottom: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-info">
          <h1>⚡ ${schoolName}</h1>
          <p>Plataforma de Gestión Educativa Integrada</p>
        </div>
        <div class="report-title">
          <h2>REPORTE DE ESTUDIANTES</h2>
          <p>Emitido: ${currentDate}</p>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-card">
          <h4>Total Alumnos</h4>
          <p>${students.length}</p>
        </div>
        <div class="meta-card">
          <h4>Al día</h4>
          <p>${students.filter(s => (s.balance || 0) === 0).length}</p>
        </div>
        <div class="meta-card">
          <h4>Con Deuda</h4>
          <p>${students.filter(s => (s.balance || 0) > 0).length}</p>
        </div>
        <div class="meta-card">
          <h4>Deuda Pendiente</h4>
          <p style="color: #dc2626;">$${totalDeuda.toLocaleString('es-ES')} USD</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre Completo</th>
            <th>Correo Electrónico</th>
            <th>Grado / Sección</th>
            <th>Apoderado</th>
            <th>Contacto</th>
            <th style="text-align: right;">Estado de Cuenta</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <span>* Reporte confidencial generado automáticamente por el sistema de administración.</span>
        <span>Página 1 de 1</span>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.close();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Helper to export transactions list to formatted printable PDF
 */
export function exportTransactionsToPDF(
  transactions: FinancialTransaction[], 
  schoolName: string = "Colegio Tesla",
  activeTeacherName?: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permita las ventanas emergentes (popups) para poder descargar el PDF.');
    return;
  }

  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalIncomes = transactions.filter(t => t.type === 'ingreso').reduce((a, b) => a + b.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'egreso').reduce((a, b) => a + b.amount, 0);
  const netBalance = totalIncomes - totalExpenses;

  const rowsHtml = transactions.map((tx, index) => `
    <tr style="border-bottom: 1px solid #e4e4e7;">
      <td style="padding: 10px 12px; font-weight: bold; color: #71717a;">TX-${String(index + 1).padStart(3, '0')}</td>
      <td style="padding: 10px 12px; color: #27272a;">${tx.date}</td>
      <td style="padding: 10px 12px; font-weight: 600; color: #18181b;">${tx.concept}</td>
      <td style="padding: 10px 12px;"><span style="background-color: #f4f4f5; color: #3f3f46; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${tx.category}</span></td>
      <td style="padding: 10px 12px; font-family: monospace; font-weight: bold; text-align: right; color: ${tx.type === 'ingreso' ? '#16a34a' : '#dc2626'};">
        ${tx.type === 'ingreso' ? '+' : '-'}$${tx.amount.toLocaleString('es-ES')} USD
      </td>
      <td style="padding: 10px 12px; text-align: right; color: #16a34a; font-weight: 600;">
        Consolidado
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte Financiero - ${schoolName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #1c1917;
          margin: 40px;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #e4e4e7;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .school-info h1 {
          font-size: 20px;
          font-weight: 800;
          color: #4f46e5;
          margin: 0 0 4px 0;
          letter-spacing: -0.025em;
        }
        .school-info p {
          font-size: 11px;
          color: #71717a;
          margin: 0;
          font-weight: 500;
        }
        .report-title {
          text-align: right;
        }
        .report-title h2 {
          font-size: 18px;
          font-weight: 700;
          color: #18181b;
          margin: 0 0 6px 0;
        }
        .report-title p {
          font-size: 11px;
          color: #71717a;
          margin: 0;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(${activeTeacherName ? '2' : '3'}, 1fr);
          gap: 15px;
          background-color: #f4f4f5;
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 30px;
        }
        .meta-card h4 {
          font-size: 9px;
          text-transform: uppercase;
          color: #71717a;
          margin: 0 0 4px 0;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .meta-card p {
          font-size: 14px;
          font-weight: 700;
          color: #18181b;
          margin: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 30px;
        }
        th {
          background-color: #fafafa;
          color: #71717a;
          text-transform: uppercase;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 10px 12px;
          text-align: left;
          border-bottom: 2px solid #e4e4e7;
        }
        .footer {
          position: fixed;
          bottom: 20px;
          left: 40px;
          right: 40px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #a1a1aa;
          border-top: 1px solid #f4f4f5;
          padding-top: 10px;
        }
        @media print {
          body { margin: 20px; }
          .no-print { display: none; }
          .footer { position: fixed; bottom: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-info">
          <h1>⚡ ${schoolName}</h1>
          <p>Plataforma de Gestión Educativa Integrada</p>
        </div>
        <div class="report-title">
          <h2>REPORTE FINANCIERO ${activeTeacherName ? ' - ' + activeTeacherName.toUpperCase() : ''}</h2>
          <p>Emitido: ${currentDate}</p>
        </div>
      </div>

      <div class="meta-grid">
        ${activeTeacherName ? `
          <div class="meta-card">
            <h4>Docente</h4>
            <p>${activeTeacherName}</p>
          </div>
          <div class="meta-card">
            <h4>Total Recibido</h4>
            <p style="color: #16a34a; font-weight: 800;">$${totalIncomes.toLocaleString('es-ES')} USD</p>
          </div>
        ` : `
          <div class="meta-card">
            <h4>Total Ingresos</h4>
            <p style="color: #16a34a; font-weight: 800;">+$${totalIncomes.toLocaleString('es-ES')} USD</p>
          </div>
          <div class="meta-card">
            <h4>Total Egresos</h4>
            <p style="color: #dc2626; font-weight: 800;">-$${totalExpenses.toLocaleString('es-ES')} USD</p>
          </div>
          <div class="meta-card">
            <h4>Saldo Neto</h4>
            <p style="color: ${netBalance >= 0 ? '#16a34a' : '#dc2626'}; font-weight: 800;">$${netBalance.toLocaleString('es-ES')} USD</p>
          </div>
        `}
      </div>

      <table>
        <thead>
          <tr>
            <th>ID Transacción</th>
            <th>Fecha</th>
            <th>Concepto / Detalle</th>
            <th>Categoría</th>
            <th style="text-align: right;">Monto</th>
            <th style="text-align: right;">Estatus Contable</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <span>* Reporte confidencial generado automáticamente por el sistema de contabilidad escolar.</span>
        <span>Página 1 de 1</span>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.close();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
