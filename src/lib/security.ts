// src/lib/security.ts

import { supabase } from '@/lib/supabase/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Validates whether the user is authenticated and retrieves their profile role.
 */
export async function requireAuth(customSupabase?: any) {
  const client = customSupabase || (await createServerSupabaseClient());
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    throw new Error('İcazəsiz giriş: İstifadəçi autentifikasiyadan keçməyib (401 Unauthorized)');
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, role, full_name, email, phone')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('İstifadəçi profili tapılmadı və ya sistemə çıxış məhdudlaşdırılıb');
  }

  return { 
    supabase: client, 
    user, 
    profile, 
    id: user.id, 
    role: profile.role, 
    email: user.email 
  };
}

/**
 * Retrieves the user role by User ID.
 */
export async function getUserRole(userId?: string): Promise<string | null> {
  try {
    if (!userId) {
      const { profile } = await requireAuth();
      return profile?.role || null;
    }
    const client = await createServerSupabaseClient();
    const { data, error } = await client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data.role;
  } catch {
    return null;
  }
}

/**
 * Validates that the user has staff privileges ('admin' OR 'manager').
 * Used for standard operational workflows: viewing orders, tracking updates, inventory edits, catalog updates.
 */
export async function requireStaff(customSupabase?: any) {
  const { supabase: client, user, profile } = await requireAuth(customSupabase);

  if (profile.role !== 'admin' && profile.role !== 'manager') {
    throw new Error('İcazəsiz əməliyyat: Bu hərəkət üçün admin və ya menecer icazəsi tələb olunur (403 Forbidden)');
  }

  return { supabase: client, user, profile };
}

/**
 * Validates that the user has strict super-admin privileges (ONLY 'admin').
 * Used for financial operations, refunds, payment status overrides, warehouse creation, and destructive bulk actions.
 */
export async function requireAdmin(customSupabase?: any) {
  const { supabase: client, user, profile } = await requireAuth(customSupabase);

  if (profile.role !== 'admin') {
    throw new Error('İcazəsiz əməliyyat: Bu hərəkət yalnız baş admin tərəfindən icra edilə bilər (403 Forbidden)');
  }

  return { supabase: client, user, profile };
}

/**
 * Validates string ID parameter.
 */
export function validateId(id: any, fieldName: string = 'ID'): string {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error(`Yanlış və ya boş parametr: ${fieldName}`);
  }
  return id.trim();
}

/**
 * Validates positive monetary amount or number (> 0).
 */
export function validatePositiveAmount(amount: any, fieldName: string = 'Məbləğ'): number {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num) || !Number.isFinite(num) || num <= 0) {
    throw new Error(`${fieldName} müsbət və düzgün ədəd olmalıdır.`);
  }
  return num;
}

export const validatePositiveNumber = validatePositiveAmount;

/**
 * Validates non-negative monetary amount or number (>= 0).
 */
export function validateNonNegativeNumber(amount: any, fieldName: string = 'Məbləğ'): number {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num) || !Number.isFinite(num) || num < 0) {
    throw new Error(`${fieldName} mənfi olmayan düzgün ədəd olmalıdır.`);
  }
  return num;
}

export const validateNonNegativeAmount = validateNonNegativeNumber;

/**
 * Validates that a number falls within an inclusive range [min, max].
 */
export function validateNumberRange(num: any, min: number, max: number, fieldName: string = 'Dəyər'): number {
  const parsed = typeof num === 'number' ? num : parseFloat(String(num));
  if (isNaN(parsed) || !Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} ${min} ilə ${max} arasında olmalıdır.`);
  }
  return parsed;
}

/**
 * Validates non-negative integer for quantities / stock (>= 0).
 */
export function validateNonNegativeInt(num: any, fieldName: string = 'Miqdar'): number {
  const parsed = typeof num === 'number' ? num : parseInt(String(num), 10);
  if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} mənfi olmayan tam ədəd olmalıdır.`);
  }
  return parsed;
}

/**
 * Validates that a string value belongs to an allowed enum list.
 */
export function validateEnum<T extends string>(value: any, allowedValues: readonly T[], fieldName: string = 'Status'): T {
  if (!value || !allowedValues.includes(value as T)) {
    throw new Error(`Yanlış ${fieldName} dəyəri: "${value}". İcazə verilən dəyərlər: ${allowedValues.join(', ')}`);
  }
  return value as T;
}

/**
 * Sanitizes input strings to prevent XSS attacks by escaping HTML characters
 * and removing common script tags/event handlers.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // 1. Remove script tags and their content
  let sanitized = input.replace(/<script[^>]*>([\S\s]*?)<\/script>/gi, '');
  
  // 2. Remove inline event handlers (e.g., onclick, onerror, onload)
  sanitized = sanitized.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*'[^']*'/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]+/gi, '');
  
  // 3. Remove javascript: pseudo-protocol URLs
  sanitized = sanitized.replace(/javascript:\s*[^"'>\s]+/gi, '');
  
  // 4. HTML Escape standard characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
    
  return sanitized;
}

/**
 * Validates file uploads to prevent malicious or oversized files from being uploaded.
 * Checks file size and verifies the MIME type against an allowed list.
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileUpload(
  file: File,
  allowedMimeTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxSizeBytes: number = 5 * 1024 * 1024 // Default 5MB
): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'Fayl seçilməyib.' };
  }

  // Check file size
  if (file.size > maxSizeBytes) {
    const sizeInMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      error: `Fayl ölçüsü çox böyükdür. Maksimum limit: ${sizeInMB} MB` 
    };
  }

  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Dəstəklənməyən fayl formatı (${file.type}). İcazə verilən formatlar: ${allowedMimeTypes.join(', ')}` 
    };
  }

  // Double-check extension matching MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeToExtMap: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/gif': ['gif'],
    'application/pdf': ['pdf']
  };

  if (extension && mimeToExtMap[file.type] && !mimeToExtMap[file.type].includes(extension)) {
    return {
      valid: false,
      error: 'Fayl formatı və genişləndirilməsi (extension) uyğun gəlmir.'
    };
  }

  return { valid: true };
}

/**
 * Creates a secure audit log record for administrative actions.
 */
export async function logAdminAction(
  userId: string,
  action: string,
  tableName: string,
  recordId?: string,
  oldValues?: Record<string, any> | null,
  newValues?: Record<string, any> | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        table_name: tableName,
        record_id: recordId,
        old_values: oldValues || null,
        new_values: newValues || null
      });

    if (error) {
      console.error('Audit log insertion failed:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Audit log unexpected error:', err);
    return { success: false, error: err?.message || 'Naməlum xəta baş verdi.' };
  }
}
