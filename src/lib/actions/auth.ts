'use server';

import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { sanitizeInput } from '@/lib/security';

const SECRET = process.env.OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secure-otp-secret-1234567890';

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export async function generateOTP(): Promise<string> {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Generate HMAC token for stateless OTP verification
 */
export async function generateToken(email: string, otp: string, expiryTime: number): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  const data = `${normalizedEmail}:${otp}:${expiryTime}`;
  const hash = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
  return `${expiryTime}:${normalizedEmail}:${hash}`;
}

/**
 * Verify HMAC token with timing-safe comparison
 */
export async function verifyToken(email: string, otp: string, token: string): Promise<boolean> {
  try {
    if (!token || !email || !otp) return false;
    const parts = token.split(':');
    if (parts.length !== 3) return false;
    
    const [expiryTimeStr, tokenEmail, hash] = parts;
    if (!expiryTimeStr || !tokenEmail || !hash) return false;
    
    const expiryTime = parseInt(expiryTimeStr, 10);
    if (isNaN(expiryTime) || Date.now() > expiryTime) {
      return false; // Expired
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    if (tokenEmail.toLowerCase() !== normalizedEmail) {
      return false; // Email mismatch
    }
    
    const data = `${normalizedEmail}:${otp.trim()}:${expiryTime}`;
    const expectedHash = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
    
    const hashBuf = Buffer.from(hash, 'hex');
    const expectedHashBuf = Buffer.from(expectedHash, 'hex');

    if (hashBuf.length !== expectedHashBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, expectedHashBuf);
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
    const cleanEmail = sanitizeInput(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: 'Düzgün e-poçt ünvanı daxil edilməlidir.' };
    }

    // Check if user already exists in DB
    const supabaseAdmin = createAdminSupabaseClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (profile) {
      return { error: 'Bu e-poçt ünvanı ilə artıq hesab mövcuddur. Zəhmət olmasa daxil olun.' };
    }

    const otp = await generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes
    const token = await generateToken(cleanEmail, otp, expiryTime);

    await sendOTPEmail(cleanEmail, otp, 'register');
    return { success: true, token };
  } catch (err: any) {
    return { error: err?.message || 'Təsdiq kodu göndərilərkən xəta baş verdi.' };
  }
}

export async function sendResetOTPAction(email: string) {
  try {
    const cleanEmail = sanitizeInput(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: 'Düzgün e-poçt ünvanı daxil edilməlidir.' };
    }
    
    const supabaseAdmin = createAdminSupabaseClient();
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!listError && users) {
      const userExists = users.some(u => u.email?.toLowerCase() === cleanEmail);
      if (!userExists) {
        return { error: 'Bu e-poçt ünvanı ilə qeydiyyatdan keçmiş istifadəçi tapılmadı.' };
      }
    }

    const otp = await generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes
    const token = await generateToken(cleanEmail, otp, expiryTime);

    await sendOTPEmail(cleanEmail, otp, 'reset');
    return { success: true, token };
  } catch (err: any) {
    return { error: err?.message || 'Şifrə sıfırlama kodu göndərilərkən xəta baş verdi.' };
  }
}

export async function verifyOTPAndRegisterAction(formData: FormData, token: string) {
  try {
    const email = sanitizeInput((formData.get('email') as string) || '').trim().toLowerCase();
    const otp = sanitizeInput((formData.get('otp') as string) || '').trim();
    const password = (formData.get('password') as string) || '';
    const fullName = sanitizeInput((formData.get('fullName') as string) || '').trim();

    if (!email || !otp || !password) {
      return { error: 'Məlumatlar tam daxil edilməyib.' };
    }

    if (password.length < 6) {
      return { error: 'Şifrə ən azı 6 simvoldan ibarət olmalıdır.' };
    }

    const isValid = await verifyToken(email, otp, token);
    if (!isValid) {
      return { error: 'Təsdiq kodu yanlışdır və ya vaxtı keçib.' };
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: fullName,
          role: 'customer' 
        } 
      },
    });

    if (error) {
      return { error: String(error.message || 'Supabase qeydiyyat xətası') };
    }

    if (data.user) {
      const adminSupabase = createAdminSupabaseClient();
      await adminSupabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        loyalty_points: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    }

    return { success: true, data: { user: data.user, session: data.session } };
  } catch (err: any) {
    return { error: err?.message || 'Qeydiyyat zamanı xəta baş verdi.' };
  }
}

export async function verifyOTPAndResetPasswordAction(formData: FormData, token: string) {
  try {
    const email = sanitizeInput((formData.get('email') as string) || '').trim().toLowerCase();
    const otp = sanitizeInput((formData.get('otp') as string) || '').trim();
    const password = (formData.get('password') as string) || '';

    if (!email || !otp || !password) {
      return { error: 'Məlumatlar tam daxil edilməyib.' };
    }

    if (password.length < 6) {
      return { error: 'Yeni şifrə ən azı 6 simvoldan ibarət olmalıdır.' };
    }

    const isValid = await verifyToken(email, otp, token);
    if (!isValid) {
      return { error: 'Təsdiq kodu yanlışdır və ya vaxtı keçib.' };
    }

    const supabaseAdmin = createAdminSupabaseClient();
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return { error: `İstifadəçi axtarış xətası: ${listError.message}` };
    }

    const user = users.find(u => u.email?.toLowerCase() === email);
    if (!user) {
      return { error: 'Bu e-poçt ünvanı ilə istifadəçi tapılmadı.' };
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: password,
    });

    if (updateError) {
      return { error: `Şifrə yenilənərkən xəta: ${updateError.message}` };
    }

    // Log password reset event in audit_logs
    try {
      await supabaseAdmin.from('audit_logs').insert([{
        user_id: user.id,
        action: 'reset_password_otp',
        entity_type: 'auth',
        entity_id: user.id,
        details: { email: email, timestamp: new Date().toISOString() }
      }]);
    } catch (logErr) {
      console.warn('Audit log write error during password reset:', logErr);
    }

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Şifrə yenilənməsi zamanı xəta baş verdi.' };
  }
}

export async function signUp(formData: FormData) {
  try {
    const email = sanitizeInput((formData.get('email') as string) || '').trim().toLowerCase();
    const password = (formData.get('password') as string) || '';
    const fullName = sanitizeInput((formData.get('fullName') as string) || '').trim();

    if (!email || !password) {
      return { error: 'E-poçt və şifrə mütləqdir.' };
    }
    if (password.length < 6) {
      return { error: 'Şifrə ən azı 6 simvol olmalıdır.' };
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: fullName,
          role: 'customer'
        } 
      },
    });
    if (error) return { error: String(error.message || 'Xəta') };

    if (data.user) {
      const adminSupabase = createAdminSupabaseClient();
      await adminSupabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        loyalty_points: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    }

    return { data: { user: data.user } };
  } catch (err: any) {
    return { error: String(err?.message || 'Server xətası') };
  }
}

export async function signIn(formData: FormData) {
  try {
    const email = sanitizeInput((formData.get('email') as string) || '').trim().toLowerCase();
    const password = (formData.get('password') as string) || '';

    if (!email || !password) {
      return { error: 'E-poçt və şifrə daxil edilməlidir.' };
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
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

