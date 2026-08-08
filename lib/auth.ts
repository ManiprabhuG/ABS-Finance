import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'abs_finance_super_secret_jwt_key_2026_finance_aios'
);

export interface UserSession {
  id: string;
  username: string;
  name: string;
  role: string;
  branch: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function signToken(payload: UserSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('abs_session')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
  COLLECTION_OFFICER: 'COLLECTION_OFFICER',
  LOAN_OFFICER: 'LOAN_OFFICER',
  VIEWER: 'VIEWER',
} as const;

export function hasPermission(role: string, requiredRoles: string[]): boolean {
  if (role === ROLES.SUPER_ADMIN) return true;
  return requiredRoles.includes(role);
}
