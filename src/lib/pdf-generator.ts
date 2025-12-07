import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface CertificateData {
  certificate_number: string;
  student_name: string;
  course_name: string;
  batch_name: string;
  grade?: string | null;
  attendance_percentage?: number | null;
  issue_date: string;
  completion_date?: string | null;
}

interface ReceiptData {
  receipt_number: string;
  student_name: string;
  admission_number: string;
  amount: number;
  payment_mode: string;
  payment_date: string;
  description?: string | null;
  batch_name?: string | null;
  course_name?: string | null;
  receipt_type?: string;
  status: string;
}

export async function downloadCertificatePDF(data: CertificateData) {
  const html = generateCertificateHTML(data);
  await printToPDF(html, `Certificate-${data.certificate_number}.pdf`);
}

export async function downloadReceiptPDF(data: ReceiptData) {
  const html = generateReceiptHTML(data);
  await printToPDF(html, `Receipt-${data.receipt_number}.pdf`);
}

async function printToPDF(html: string, filename: string) {
  // Create a new window with the HTML content
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.');
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load
  await new Promise(resolve => setTimeout(resolve, 500));

  // Trigger print dialog (user can save as PDF)
  printWindow.print();
}

function generateCertificateHTML(data: CertificateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${data.certificate_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
    
    @media print {
      @page {
        size: landscape;
        margin: 0;
      }
      body { margin: 0; }
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      background: white;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .certificate {
      width: 900px;
      min-height: 600px;
      background: white;
      border: 4px solid #1F5AA6;
      padding: 50px;
      position: relative;
    }
    
    .certificate::before {
      content: '';
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      bottom: 12px;
      border: 2px solid #1F5AA6;
      pointer-events: none;
    }
    
    .corner {
      position: absolute;
      width: 60px;
      height: 60px;
      border: 3px solid #1F5AA6;
    }
    
    .corner-tl { top: 20px; left: 20px; border-right: none; border-bottom: none; }
    .corner-tr { top: 20px; right: 20px; border-left: none; border-bottom: none; }
    .corner-bl { bottom: 20px; left: 20px; border-right: none; border-top: none; }
    .corner-br { bottom: 20px; right: 20px; border-left: none; border-top: none; }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .logo {
      font-size: 36px;
      font-weight: 700;
      color: #1F5AA6;
      font-family: 'Playfair Display', serif;
      margin-bottom: 5px;
    }
    
    .subtitle {
      font-size: 14px;
      color: #64748b;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    
    .title {
      text-align: center;
      margin: 30px 0;
    }
    
    .title h1 {
      font-family: 'Playfair Display', serif;
      font-size: 40px;
      color: #1F5AA6;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    
    .cert-number {
      font-size: 12px;
      color: #94a3b8;
      font-family: monospace;
    }
    
    .content {
      text-align: center;
      margin: 30px 0;
    }
    
    .content p {
      font-size: 16px;
      color: #475569;
      margin: 12px 0;
    }
    
    .student-name {
      font-family: 'Playfair Display', serif;
      font-size: 48px;
      color: #1e293b;
      margin: 20px 0;
      font-style: italic;
    }
    
    .course-name {
      font-size: 28px;
      color: #1F5AA6;
      font-weight: 600;
      margin: 20px 0;
    }
    
    .details {
      display: flex;
      justify-content: center;
      gap: 60px;
      margin: 25px 0;
    }
    
    .detail-item {
      text-align: center;
    }
    
    .detail-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .detail-value {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 5px;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
      padding-top: 25px;
      border-top: 1px solid #e2e8f0;
    }
    
    .signature {
      text-align: center;
      width: 180px;
    }
    
    .signature-line {
      border-top: 2px solid #1e293b;
      margin-bottom: 8px;
    }
    
    .signature-text {
      font-size: 11px;
      color: #64748b;
    }
    
    .issue-date {
      text-align: center;
      font-size: 14px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
    
    <div class="header">
      <div class="logo">GANISHKA TECHNOLOGY</div>
      <div class="subtitle">Tech Coaching Institute</div>
    </div>
    
    <div class="title">
      <h1>Certificate of Completion</h1>
      <div class="cert-number">${data.certificate_number}</div>
    </div>
    
    <div class="content">
      <p>This is to certify that</p>
      <div class="student-name">${data.student_name}</div>
      <p>has successfully completed the training program in</p>
      <div class="course-name">${data.course_name}</div>
      <p>Batch: ${data.batch_name}</p>
    </div>
    
    <div class="details">
      ${data.grade ? `<div class="detail-item">
        <div class="detail-label">Grade</div>
        <div class="detail-value">${data.grade}</div>
      </div>` : ''}
      ${data.attendance_percentage ? `<div class="detail-item">
        <div class="detail-label">Attendance</div>
        <div class="detail-value">${data.attendance_percentage}%</div>
      </div>` : ''}
      ${data.completion_date ? `<div class="detail-item">
        <div class="detail-label">Completed On</div>
        <div class="detail-value">${data.completion_date}</div>
      </div>` : ''}
    </div>
    
    <div class="footer">
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-text">Director</div>
      </div>
      <div class="issue-date">
        Issue Date: ${data.issue_date}
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-text">Course Coordinator</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function generateReceiptHTML(data: ReceiptData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${data.receipt_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    @media print {
      @page {
        size: A5;
        margin: 10mm;
      }
      body { margin: 0; }
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      background: white;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .receipt {
      width: 420px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    
    .header {
      background: linear-gradient(135deg, ${data.receipt_type === 'GT' ? '#1F5AA6' : '#16a34a'} 0%, ${data.receipt_type === 'GT' ? '#2563eb' : '#22c55e'} 100%);
      color: white;
      padding: 25px;
      text-align: center;
    }
    
    .logo {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .subtitle {
      font-size: 11px;
      opacity: 0.85;
      letter-spacing: 1px;
    }
    
    .receipt-title {
      background: #f8fafc;
      padding: 15px;
      text-align: center;
      border-bottom: 1px dashed #cbd5e1;
    }
    
    .receipt-title h2 {
      font-size: 16px;
      color: #1e293b;
      margin-bottom: 4px;
    }
    
    .receipt-number {
      font-family: monospace;
      font-size: 13px;
      color: #64748b;
    }
    
    .content {
      padding: 20px;
    }
    
    .row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .row:last-child {
      border-bottom: none;
    }
    
    .label {
      color: #64748b;
      font-size: 13px;
    }
    
    .value {
      color: #1e293b;
      font-weight: 500;
      font-size: 13px;
      text-align: right;
    }
    
    .amount-section {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      margin: 15px -20px;
      padding: 18px 20px;
      border-top: 2px dashed #cbd5e1;
      border-bottom: 2px dashed #cbd5e1;
    }
    
    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .amount-label {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
    }
    
    .amount-value {
      font-size: 26px;
      font-weight: 700;
      color: ${data.receipt_type === 'GT' ? '#1F5AA6' : '#16a34a'};
    }
    
    .status-section {
      text-align: center;
      margin-top: 12px;
    }
    
    .status-badge {
      display: inline-block;
      background: #dcfce7;
      color: #16a34a;
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .footer {
      padding: 18px;
      text-align: center;
      background: #fafafa;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      font-size: 11px;
      color: #94a3b8;
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">${data.receipt_type === 'GT' ? 'GANISHKA TECHNOLOGY' : 'GANISHKA ACADEMY'}</div>
      <div class="subtitle">${data.receipt_type === 'GT' ? 'Tech Coaching Institute' : 'Education Institute'}</div>
    </div>
    
    <div class="receipt-title">
      <h2>Payment Receipt</h2>
      <div class="receipt-number">${data.receipt_number}</div>
    </div>
    
    <div class="content">
      <div class="row">
        <span class="label">Date</span>
        <span class="value">${data.payment_date}</span>
      </div>
      <div class="row">
        <span class="label">Student Name</span>
        <span class="value">${data.student_name}</span>
      </div>
      <div class="row">
        <span class="label">Admission No</span>
        <span class="value">${data.admission_number}</span>
      </div>
      ${data.batch_name ? `<div class="row">
        <span class="label">Batch</span>
        <span class="value">${data.batch_name}</span>
      </div>` : ''}
      ${data.course_name ? `<div class="row">
        <span class="label">Course</span>
        <span class="value">${data.course_name}</span>
      </div>` : ''}
      <div class="row">
        <span class="label">Receipt Type</span>
        <span class="value">${data.receipt_type || 'GA'}</span>
      </div>
      <div class="row">
        <span class="label">Payment Mode</span>
        <span class="value">${data.payment_mode.charAt(0).toUpperCase() + data.payment_mode.slice(1).replace('_', ' ')}</span>
      </div>
      ${data.description ? `<div class="row">
        <span class="label">Description</span>
        <span class="value">${data.description}</span>
      </div>` : ''}
      
      <div class="amount-section">
        <div class="amount-row">
          <span class="amount-label">Amount Paid</span>
          <span class="amount-value">₹${data.amount.toLocaleString()}</span>
        </div>
      </div>
      
      <div class="status-section">
        <span class="status-badge">${data.status}</span>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for your payment!</p>
      <p>This is a computer-generated receipt.</p>
    </div>
  </div>
</body>
</html>
  `;
}
