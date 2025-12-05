import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    
    let html = '';
    let filename = '';

    if (type === 'certificate') {
      filename = `Certificate-${data.certificate_number}.pdf`;
      html = generateCertificateHTML(data);
    } else if (type === 'receipt') {
      filename = `Receipt-${data.receipt_number}.pdf`;
      html = generateReceiptHTML(data);
    } else {
      throw new Error('Invalid document type');
    }

    // Return HTML for client-side PDF generation
    return new Response(
      JSON.stringify({ html, filename }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function generateCertificateHTML(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .certificate {
      width: 800px;
      background: white;
      border: 3px solid #1F5AA6;
      padding: 50px;
      position: relative;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    
    .certificate::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 2px solid #1F5AA6;
      pointer-events: none;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .logo {
      font-size: 32px;
      font-weight: 700;
      color: #1F5AA6;
      font-family: 'Playfair Display', serif;
      margin-bottom: 5px;
    }
    
    .subtitle {
      font-size: 14px;
      color: #64748b;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    
    .title {
      text-align: center;
      margin: 40px 0;
    }
    
    .title h1 {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      color: #1F5AA6;
      letter-spacing: 3px;
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
      margin: 40px 0;
    }
    
    .content p {
      font-size: 16px;
      color: #475569;
      margin: 15px 0;
    }
    
    .student-name {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      color: #1e293b;
      margin: 20px 0;
      font-style: italic;
    }
    
    .course-name {
      font-size: 24px;
      color: #1F5AA6;
      font-weight: 600;
      margin: 20px 0;
    }
    
    .details {
      display: flex;
      justify-content: center;
      gap: 50px;
      margin: 30px 0;
    }
    
    .detail-item {
      text-align: center;
    }
    
    .detail-label {
      font-size: 12px;
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
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #e2e8f0;
    }
    
    .signature {
      text-align: center;
      width: 200px;
    }
    
    .signature-line {
      border-top: 2px solid #1e293b;
      margin-bottom: 10px;
    }
    
    .signature-text {
      font-size: 12px;
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

function generateReceiptHTML(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      background: #f1f5f9;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .receipt {
      width: 400px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #1F5AA6 0%, #2563eb 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .logo {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .subtitle {
      font-size: 12px;
      opacity: 0.8;
    }
    
    .receipt-title {
      background: #f8fafc;
      padding: 15px;
      text-align: center;
      border-bottom: 1px dashed #e2e8f0;
    }
    
    .receipt-title h2 {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 5px;
    }
    
    .receipt-number {
      font-family: monospace;
      font-size: 14px;
      color: #64748b;
    }
    
    .content {
      padding: 25px;
    }
    
    .row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .row:last-child {
      border-bottom: none;
    }
    
    .label {
      color: #64748b;
      font-size: 14px;
    }
    
    .value {
      color: #1e293b;
      font-weight: 500;
      font-size: 14px;
      text-align: right;
    }
    
    .amount-section {
      background: #f8fafc;
      margin: 20px -25px;
      padding: 20px 25px;
      border-top: 2px dashed #e2e8f0;
      border-bottom: 2px dashed #e2e8f0;
    }
    
    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .amount-label {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
    
    .amount-value {
      font-size: 28px;
      font-weight: 700;
      color: #1F5AA6;
    }
    
    .footer {
      padding: 20px;
      text-align: center;
      background: #fafafa;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      font-size: 12px;
      color: #94a3b8;
      margin: 5px 0;
    }
    
    .status-badge {
      display: inline-block;
      background: #dcfce7;
      color: #16a34a;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">GANISHKA TECHNOLOGY</div>
      <div class="subtitle">Tech Coaching Institute</div>
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
      <div class="row">
        <span class="label">Payment Mode</span>
        <span class="value">${data.payment_mode}</span>
      </div>
      ${data.description ? `<div class="row">
        <span class="label">Description</span>
        <span class="value">${data.description}</span>
      </div>` : ''}
      
      <div class="amount-section">
        <div class="amount-row">
          <span class="amount-label">Amount Paid</span>
          <span class="amount-value">₹${data.amount}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
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
