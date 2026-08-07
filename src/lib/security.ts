// src/lib/security.ts

import { supabase } from '@/lib/supabase/client';

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
