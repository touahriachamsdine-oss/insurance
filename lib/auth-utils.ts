import crypto from 'crypto';
import { cookies } from 'next/headers';
import { queryOne, query } from './db';

// Simple, secure hashing using PBKDF2
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

const JWT_SECRET = process.env.JWT_SECRET || 'daman-jwt-secret-key-123456-dz-2026';

// Simple signed token representation
export function signSession(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${data}`)
    .digest('base64url');
  return `${header}.${data}.${signature}`;
}

export function verifySession(token: string): any | null {
  try {
    const [header, data, signature] = token.split('.');
    if (!header || !data || !signature) return null;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${data}`)
      .digest('base64url');
    if (signature !== expectedSignature) return null;
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('daman-session')?.value;
    if (!token) return null;
    const payload = verifySession(token);
    if (!payload || !payload.id) return null;

    // Fetch user details directly from public.users
    const user = await queryOne(
      `SELECT id, email, role, company_id, full_name_ar, full_name_en, is_active
       FROM public.users
       WHERE id = $1`,
      [payload.id]
    );
    return user || null;
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
    return null;
  }
}
