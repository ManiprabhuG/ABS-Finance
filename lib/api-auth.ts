import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * Verifies the request has a valid session.
 * Returns { session } on success, or a 401 NextResponse on failure.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 }),
    };
  }
  return { session, error: null };
}

/**
 * Verifies the request has a valid session AND the user has one of the required roles.
 */
export async function requireRole(allowedRoles: string[]) {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  if (session!.role !== 'SUPER_ADMIN' && !allowedRoles.includes(session!.role)) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Forbidden. You do not have permission to perform this action.' },
        { status: 403 }
      ),
    };
  }
  return { session: session!, error: null };
}
