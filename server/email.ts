import nodemailer from 'nodemailer';
import { maskEmail } from '../src/utils/masking.ts';

export interface SentEmailRecord {
  id: string;
  to: string;
  recipientName: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  otpCode: string;
  purpose: 'PASSWORD_RESET' | 'LOGIN_2FA';
  status: 'sent_smtp' | 'queued_simulation' | 'failed';
  sentAt: string;
  error?: string;
}

// In-memory record of sent emails for audit and in-app mailbox preview
const sentEmailsOutbox: SentEmailRecord[] = [];

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from?: string;
}

let activeSmtpConfig: SmtpConfig | null = null;

// Initialize from env or verified production credentials
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  activeSmtpConfig = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || `"IT Building Portal" <${process.env.SMTP_USER}>`,
  };
} else {
  activeSmtpConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 't14583925@gmail.com',
    pass: 'tzjyninmxkhbrjje',
    from: '"IT Building Portal" <t14583925@gmail.com>',
  };
}

export function isSmtpConfigured(): boolean {
  return !!activeSmtpConfig;
}

export function getSmtpConfig(): { host: string; port: number; secure: boolean; user: string; from?: string } | null {
  if (!activeSmtpConfig) return null;
  return {
    host: activeSmtpConfig.host,
    port: activeSmtpConfig.port,
    secure: activeSmtpConfig.secure,
    user: activeSmtpConfig.user,
    from: activeSmtpConfig.from,
  };
}

export function setSmtpConfig(config: SmtpConfig | null) {
  activeSmtpConfig = config;
}

// Create nodemailer transporter from active configuration or env
function createTransporter() {
  if (activeSmtpConfig) {
    return nodemailer.createTransport({
      host: activeSmtpConfig.host,
      port: activeSmtpConfig.port,
      secure: activeSmtpConfig.secure,
      auth: {
        user: activeSmtpConfig.user,
        pass: activeSmtpConfig.pass,
      },
    });
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  return null;
}

export async function testSmtpConnection(
  testRecipient: string,
  configOverride?: SmtpConfig
): Promise<{ success: boolean; message: string; error?: string }> {
  const config = configOverride || activeSmtpConfig;
  if (!config) {
    return { success: false, message: 'ยังไม่ได้ระบุข้อมูลการเชื่อมต่อ SMTP' };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  try {
    // First verify connection
    await transporter.verify();
    // Then send a test email
    await transporter.sendMail({
      from: config.from || `"IT Building Portal" <${config.user}>`,
      to: testRecipient,
      subject: '[IT Building] ทดสอบการเชื่อมต่อระบบส่งอีเมล (SMTP Test Successful)',
      text: 'ยินดีด้วย! ระบบส่งอีเมล IT Building Portal เชื่อมต่อกับ SMTP Server สำเร็จเรียบร้อยแล้ว',
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #38bdf8;">✅ ทดสอบการเชื่อมต่อ SMTP สำเร็จ!</h2>
          <p>อีเมลฉบับนี้เป็นการยืนยันว่าระบบ IT Building Portal สามารถส่งอีเมลเข้ากล่องจดหมายของคุณได้จริง</p>
          <p style="font-size: 12px; color: #94a3b8;">ส่งผ่านโฮสต์: ${config.host}:${config.port} (${config.user})</p>
        </div>
      `,
    });
    return { success: true, message: `ส่งอีเมลทดสอบไปยัง ${testRecipient} สำเร็จเรียบร้อยแล้ว` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: 'การเชื่อมต่อกับ SMTP ล้มเหลว', error: errorMsg };
  }
}

/**
 * Generate responsive HTML email for Password Reset OTP
 */
function generatePasswordResetHtml(params: {
  to: string;
  recipientName: string;
  otpCode: string;
  expiresInMinutes: number;
}): string {
  const { recipientName, otpCode, expiresInMinutes } = params;
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รหัส OTP สำหรับตั้งค่ารหัสผ่านใหม่</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580" style="max-width: 580px; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #0e7490 0%, #1e1b4b 100%); text-align: left;">
              <div style="font-size: 13px; font-weight: 700; color: #38bdf8; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px;">
                Faculty of Information Technology
              </div>
              <div style="font-size: 20px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                ระบบบริการทรัพยากรส่วนกลาง อาคารเทคโนโลยีสารสนเทศ
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px; text-align: left;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #f8fafc;">
                เรียน คุณ ${recipientName || 'ผู้ใช้งานระบบ'}
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีผู้ใช้งานของคุณ เพื่อความปลอดภัยในการเข้าถึง กรุณาใช้รหัสยืนยัน OTP ด้านล่างนี้เพื่อดำเนินการตั้งรหัสผ่านใหม่:
              </p>

              <!-- OTP Highlight Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background-color: #020617; border: 1px solid #0284c7; border-radius: 12px; padding: 24px 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: #38bdf8; letter-spacing: 0.1em; margin-bottom: 8px;">
                      รหัสยืนยันตัวตน (ONE-TIME PASSWORD)
                    </div>
                    <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">
                      ${otpCode}
                    </div>
                    <div style="font-size: 12px; color: #f59e0b; margin-top: 8px;">
                      ⏱️ รหัสนี้มีอายุการใช้งาน ${expiresInMinutes} นาที
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notices -->
              <div style="background-color: #1e293b; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #cbd5e1;">
                  <strong>ข้อควรระวังเพื่อความปลอดภัย:</strong><br/>
                  • รหัส OTP เป็นความลับเฉพาะคุณ ห้ามเปิดเผยหรือส่งต่อให้ผู้อื่นเด็ดขาด<br/>
                  • หากคุณไม่ได้เป็นผู้ทำรายการนี้ โปรดเพิกเฉยต่ออีเมลฉบับนี้ รหัสผ่านเดิมของคุณจะยังคงปลอดภัย
                </p>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                ขอแสดงความนับถือ<br/>
                <strong style="color: #94a3b8;">คณะทำงานบริหารระบบ อาคารเทคโนโลยีสารสนเทศ</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #020617; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b;">
              อีเมลฉบับนี้ถูกส่งจากระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Dispatch Password Reset Email via SMTP or simulation outbox
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  recipientName: string;
  otpCode: string;
  ipAddress?: string;
}): Promise<{ success: boolean; mode: 'smtp' | 'simulated'; error?: string }> {
  const { to, recipientName, otpCode } = params;
  const subject = `[IT Building] รหัสยืนยัน OTP สำหรับตั้งรหัสผ่านใหม่ (${otpCode})`;
  const htmlContent = generatePasswordResetHtml({
    to,
    recipientName,
    otpCode,
    expiresInMinutes: 5,
  });
  const textContent = `เรียน คุณ ${recipientName}\n\nรหัสยืนยัน OTP สำหรับตั้งรหัสผ่านใหม่ของคุณคือ: ${otpCode} (รหัสมีอายุ 5 นาที)\n\nหากคุณไม่ได้เป็นผู้ขอรีเซ็ตรหัสผ่าน โปรดเพิกเฉยต่อข้อความนี้`;

  const record: SentEmailRecord = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to,
    recipientName,
    subject,
    htmlContent,
    textContent,
    otpCode,
    purpose: 'PASSWORD_RESET',
    status: 'queued_simulation',
    sentAt: new Date().toISOString(),
  };

  const transporter = createTransporter();
  const fromAddress = process.env.SMTP_FROM || '"IT Building Service" <no-reply@it-building.edu>';

  if (transporter) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });
      record.status = 'sent_smtp';
      sentEmailsOutbox.unshift(record);
      if (sentEmailsOutbox.length > 100) sentEmailsOutbox.pop();

      console.log(`[EMAIL DISPATCH - SMTP SUCCESS] Sent to: ${to}, Subject: ${subject}`);
      return { success: true, mode: 'smtp' };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[EMAIL DISPATCH - SMTP FAILED] Error sending to ${to}:`, errMsg);
      record.status = 'failed';
      record.error = errMsg;
      sentEmailsOutbox.unshift(record);
      // Fallback: still keep in outbox so user is not completely blocked
      return { success: true, mode: 'simulated', error: `SMTP: ${errMsg}` };
    }
  }

  // If no SMTP configured, save in simulation outbox for in-app preview
  record.status = 'queued_simulation';
  sentEmailsOutbox.unshift(record);
  if (sentEmailsOutbox.length > 100) sentEmailsOutbox.pop();

  console.log(`[EMAIL DISPATCH - SIMULATION] Generated reset email for ${maskEmail(to)}. Stored in outbox.`);
  return { success: true, mode: 'simulated' };
}

/**
 * Retrieve sent emails for a specific recipient (for testing/preview)
 */
export function getSentEmailsForUser(email: string): SentEmailRecord[] {
  const cleanEmail = email.trim().toLowerCase();
  return sentEmailsOutbox.filter((e) => e.to.trim().toLowerCase() === cleanEmail);
}

/**
 * Retrieve the latest sent email across system
 */
export function getLatestSentEmail(email?: string): SentEmailRecord | null {
  if (email) {
    const list = getSentEmailsForUser(email);
    return list.length > 0 ? list[0] : null;
  }
  return sentEmailsOutbox.length > 0 ? sentEmailsOutbox[0] : null;
}
