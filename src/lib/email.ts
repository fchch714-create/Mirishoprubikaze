// src/lib/email.ts

import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Universal Email Sender using Resend API (if RESEND_API_KEY set) or Nodemailer SMTP fallback
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { to, subject, html, text } = options;
    if (!to || !to.includes('@')) {
      console.warn('sendEmail skipped: Invalid or missing email address', to);
      return { success: false, error: 'Keçərli email ünvanı daxil edilməyib.' };
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;

    // 1. Try Resend API first if configured
    if (resendApiKey) {
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'RubikShop <info@rubikshop.az>';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject: subject,
          html: html,
          text: text || html.replace(/<[^>]+>/g, '')
        })
      });

      if (response.ok) {
        console.log(`[Resend API] Email successfully sent to ${to}`);
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Resend API Error]:', errorData);
      }
    }

    // 2. Try Nodemailer SMTP fallback if configured
    if (smtpHost && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"RubikShop.az" <noreply@rubikshop.az>',
        to: to,
        subject: subject,
        html: html,
        text: text || html.replace(/<[^>]+>/g, '')
      });

      console.log(`[Nodemailer SMTP] Email sent to ${to}`);
      return { success: true };
    }

    // 3. Fallback dev logging if no service keys
    console.log(`[DEV MODE Email Simulated to ${to}]:`, { subject, bodyPreview: html.substring(0, 100) });
    return { success: true };
  } catch (err: any) {
    console.error('sendEmail Error:', err);
    return { success: false, error: err.message || 'Email göndərilərkən xəta baş verdi.' };
  }
}

/**
 * Send Payment Confirmed Notification Email to Customer
 */
export async function sendPaymentConfirmedEmail(payload: {
  customerEmail: string;
  customerName: string;
  preorderCode: string;
  productTitle: string;
  leadTime?: string;
  queuePosition?: number | null;
}) {
  const { customerEmail, customerName, preorderCode, productTitle, leadTime, queuePosition } = payload;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #38bdf8; font-size: 24px; margin: 0;">RubikShop.az</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 5px;">Ön Sifariş Təsdiq Bildirişi</p>
      </div>

      <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px;">
        <h2 style="color: #22c55e; font-size: 18px; margin-top: 0;">Ödənişiniz Uğurla Təsdiqləndi! ✅</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          Hörmətli <strong>${customerName}</strong>, <br/>
          Ön sifarişiniz üzrə ödəniş təsdiqləndi və sistemimizdə canlı növbəyə alındı.
        </p>
      </div>

      <div style="background-color: #0284c7; color: #ffffff; padding: 15px 20px; border-radius: 12px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; font-weight: bold;">Sifariş Kodu: <span style="font-size: 18px; letter-spacing: 1px;">${preorderCode}</span></p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Məhsul: <strong>${productTitle}</strong></p>
        ${queuePosition ? `<p style="margin: 5px 0 0 0; font-size: 15px; color: #fef08a;">Canlı Növbə Sıranız: <strong>#${queuePosition}</strong></p>` : ''}
        <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Təxmini Çatdırılma Müddəti: ${leadTime || '14-28 iş günü'}</p>
      </div>

      <div style="text-align: center; margin-top: 25px; border-top: 1px solid #334155; pt: 20px;">
        <p style="font-size: 12px; color: #64748b;">
          Sifarişinizin statusunu istənilən vaxt saytımızdakı <strong>"Sifarişimi Yoxla"</strong> bölməsindən izləyə bilərsiniz.
        </p>
        <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
          © 2026 RubikShop.az — Bütün hüquqlar qorunur.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Ödənişiniz Təsdiqləndi! Ön Sifariş Kodu: ${preorderCode} — RubikShop.az`,
    html
  });
}

/**
 * Send Stock Assigned (Item Reserved/Arrived) Email
 */
export async function sendStockAssignedEmail(payload: {
  customerEmail: string;
  customerName: string;
  preorderCode: string;
  productTitle: string;
}) {
  const { customerEmail, customerName, preorderCode, productTitle } = payload;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #38bdf8; font-size: 24px; margin: 0;">RubikShop.az</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 5px;">Məhsul Anbara Daxil Oldu! 📦</p>
      </div>

      <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px;">
        <h2 style="color: #eab308; font-size: 18px; margin-top: 0;">Şad Xəbər! Məhsulunuz Sizin Üçün Ayrıldı 🎉</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          Hörmətli <strong>${customerName}</strong>, <br/>
          Ön sifariş etdiyiniz <strong>"${productTitle}"</strong> məhsulu anbarımıza daxil oldu və növbəniz üzrə sizin üçün rezerv edildi!
        </p>
      </div>

      <div style="background-color: #059669; color: #ffffff; padding: 15px 20px; border-radius: 12px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; font-weight: bold;">Sifariş Kodu: <span style="font-size: 18px;">${preorderCode}</span></p>
        <p style="margin: 5px 0 0 0; font-size: 13px;">Status: <strong>Çatdırılmaya Hazırlanır</strong></p>
      </div>

      <div style="text-align: center; margin-top: 25px; border-top: 1px solid #334155; pt: 20px;">
        <p style="font-size: 12px; color: #64748b;">
          Kuryerimiz yaxın saatlarda çatdırılma üçün sizinlə əlaqə saxlayacaqdır.
        </p>
        <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
          © 2026 RubikShop.az — Bütün hüquqlar qorunur.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Məhsulunuz Anbara Daxil Oldu və Sizin Üçün Ayrıldı! (${preorderCode}) — RubikShop.az`,
    html
  });
}
