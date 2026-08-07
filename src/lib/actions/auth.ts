'use server';

import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

const SECRET = process.env.OTP_SECRET || 'fallback-secure-otp-secret-1234567890';

export async function generateOTP(): Promise<string> {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function generateToken(email: string, otp: string, expiryTime: number): Promise<string> {
  const data = `${email.toLowerCase()}:${otp}:${expiryTime}`;
  const hash = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
  return `${expiryTime}:${email.toLowerCase()}:${hash}`;
}

export async function verifyToken(email: string, otp: string, token: string): Promise<boolean> {
  try {
    if (!token) return false;
    const [expiryTimeStr, tokenEmail, hash] = token.split(':');
    if (!expiryTimeStr || !tokenEmail || !hash) return false;
    
    const expiryTime = parseInt(expiryTimeStr, 10);
    if (Date.now() > expiryTime) {
      return false; // Expired
    }
    
    if (tokenEmail.toLowerCase() !== email.toLowerCase()) {
      return false; // Email mismatch
    }
    
    const data = `${tokenEmail.toLowerCase()}:${otp}:${expiryTime}`;
    const expectedHash = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
    
    return hash === expectedHash;
  } catch (err) {
    return false;
  }
}

let transporterInstance: any = null;

function getTransporter() {
  if (!transporterInstance) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn('SMTP_USER or SMTP_PASS not set. Emails will only be logged to server console.');
      return null;
    }

    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }
  return transporterInstance;
}

async function sendOTPEmail(email: string, otp: string, type: 'register' | 'reset') {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@rubikshopaz.com';
  const transporter = getTransporter();

  const subject = type === 'register' 
    ? 'Rubikshop.az - Qeydiyyat üçün Təsdiq Kodu' 
    : 'Rubikshop.az - Şifrə Sıfırlama Kodu';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #44403c; border-radius: 12px; background-color: #1c1917; color: #f5f5f4;">
      <h2 style="color: #ef4444; text-align: center; font-weight: 800; font-size: 24px; margin-bottom: 20px;">Rubikshop.az Təsdiq Kodu</h2>
      <p style="font-size: 16px; color: #e7e5e4;">Salam,</p>
      <p style="font-size: 16px; color: #e7e5e4; line-height: 1.5;">
        ${type === 'register' ? 'Rubikshop.az platformasında qeydiyyatdan keçmək üçün təsdiq kodunuz:' : 'Rubikshop.az hesabınızın şifrəsini sıfırlamaq üçün təsdiq kodunuz:'}
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #ef4444; background-color: #292524; padding: 12px 25px; border: 1px solid #44403c; border-radius: 10px; display: inline-block;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 14px; color: #a8a29e; text-align: center;">Bu kod 5 dəqiqə ərzində etibarlıdır.</p>
      <hr style="border: 0; border-top: 1px solid #44403c; margin: 25px 0;" />
      <p style="font-size: 12px; color: #78716c; text-align: center;">Rubikshop.az - Bütün hüquqlar qorunur.</p>
    </div>
  `;

  if (!transporter) {
    console.log(`\n==================================================`);
    console.log(`[STATELESS OTP SERVICE] Email: ${email}`);
    console.log(`[STATELESS OTP SERVICE] Type: ${type}`);
    console.log(`[STATELESS OTP SERVICE] OTP Code: ${otp}`);
    console.log(`==================================================\n`);
    return { loggedToConsole: true };
  }

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: any) {
    console.error('SMTP email send failed:', err);
    console.log(`\n==================================================`);
    console.log(`[STATELESS OTP FALLBACK] Email: ${email}`);
    console.log(`[STATELESS OTP FALLBACK] Type: ${type}`);
    console.log(`[STATELESS OTP FALLBACK] OTP Code: ${otp}`);
    console.log(`==================================================\n`);
    return { loggedToConsole: true, error: err.message };
  }
}

export async function sendOTPAction(email: string) {
  try {
    if (!email) {
      return { error: 'E-poçt ünvanı daxil edilməyib.' };
    }

    // Check if user already exists in Auth DB
    const supabaseAdmin = createAdminSupabaseClient();
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (!listError && users) {
      const userExists = users.some(u => u.email?.toLowerCase() === email.toLowerCase());
      if (userExists) {
        return { error: 'Bu e-poçt ünvanı ilə artıq hesab yaradılıb. Zəhmət olmasa daxil olun.' };
      }
    }

    const otp = await generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes
    const token = await generateToken(email, otp, expiryTime);

    await sendOTPEmail(email, otp, 'register');
    return { success: true, token };
  } catch (err: any) {
    return { error: err?.message || 'Təsdiq kodu göndərilərkən xəta baş verdi.' };
  }
}

export async function sendResetOTPAction(email: string) {
  try {
    if (!email) {
      return { error: 'E-poçt ünvanı daxil edilməyib.' };
    }
    
    // Optional check: see if user exists in Auth DB
    const supabaseAdmin = createAdminSupabaseClient();
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!listError) {
      const userExists = users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!userExists) {
        return { error: 'Bu e-poçt ünvanı ilə qeydiyyatdan keçmiş istifadəçi tapılmadı.' };
      }
    }

    const otp = await generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes
    const token = await generateToken(email, otp, expiryTime);

    await sendOTPEmail(email, otp, 'reset');
    return { success: true, token };
  } catch (err: any) {
    return { error: err?.message || 'Şifrə sıfırlama kodu göndərilərkən xəta baş verdi.' };
  }
}

export async function verifyOTPAndRegisterAction(formData: FormData, token: string) {
  try {
    const email = formData.get('email') as string;
    const otp = formData.get('otp') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    if (!email || !otp || !password) {
      return { error: 'Məlumatlar tam daxil edilməyib.' };
    }

    const isValid = await verifyToken(email, otp, token);
    if (!isValid) {
      return { error: 'Təsdiq kodu yanlışdır və ya vaxtı keçib.' };
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      return { error: String(error.message || 'Supabase qeydiyyat xətası') };
    }

    return { success: true, data: { user: data.user, session: data.session } };
  } catch (err: any) {
    return { error: err?.message || 'Qeydiyyat zamanı xəta baş verdi.' };
  }
}

export async function verifyOTPAndResetPasswordAction(formData: FormData, token: string) {
  try {
    const email = formData.get('email') as string;
    const otp = formData.get('otp') as string;
    const password = formData.get('password') as string;

    if (!email || !otp || !password) {
      return { error: 'Məlumatlar tam daxil edilməyib.' };
    }

    const isValid = await verifyToken(email, otp, token);
    if (!isValid) {
      return { error: 'Təsdiq kodu yanlışdır və ya vaxtı keçib.' };
    }

    const supabaseAdmin = createAdminSupabaseClient();
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return { error: `İstifadəçi siyahısı yüklənərkən xəta: ${listError.message}` };
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { error: 'Bu e-poçt ünvanı ilə istifadəçi tapılmadı.' };
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: password,
    });

    if (updateError) {
      return { error: `Şifrə yenilənərkən xəta: ${updateError.message}` };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Şifrə yenilənməsi zamanı xəta baş verdi.' };
  }
}

export async function signUp(formData: FormData) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      options: { data: { full_name: formData.get('fullName') as string } },
    });
    if (error) return { error: String(error.message || 'Xəta') };
    return { data: { user: data.user } };
  } catch (err: any) {
    return { error: String(err?.message || 'Server xətası') };
  }
}

export async function signIn(formData: FormData) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
    if (error) return { error: String(error.message || 'Xəta') };
    return { data };
  } catch (err: any) {
    return { error: String(err?.message || 'Server xətası') };
  }
}

export async function signOut() {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) return { error: String(error.message || 'Xəta') };
    return { success: true };
  } catch (err: any) {
    return { error: String(err?.message || 'Server xətası') };
  }
}
