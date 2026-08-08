import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';
import bcrypt from 'bcryptjs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, username: true, name: true, email: true, role: true, branch: true, status: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only SUPER_ADMIN can modify user accounts
    const { session, error } = await requireRole(['SUPER_ADMIN']);
    if (error) return error;

    const { id } = await params;
    const data = await request.json();

    if (!data.name || !data.role) {
      return NextResponse.json({ error: 'Name and Role are required' }, { status: 400 });
    }

    const updateData: any = {
      name: data.name,
      email: data.email || null,
      role: data.role,
      branch: data.branch || 'Main Branch',
      status: data.status || 'ACTIVE',
    };

    if (data.password) {
      if (data.password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
    });

    await db.auditLog.create({
      data: {
        userId: session!.id,
        username: session!.username,
        action: 'UPDATE',
        module: 'USER',
        details: `Updated user account @${updated.username} (Role: ${updated.role}, Status: ${updated.status})`,
      },
    });

    return NextResponse.json({ id: updated.id, username: updated.username, name: updated.name, role: updated.role, status: updated.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only SUPER_ADMIN can delete users — BUG-015 & BUG-019 FIX
    const { session, error } = await requireRole(['SUPER_ADMIN']);
    if (error) return error;

    const { id } = await params;

    // Cannot delete yourself
    if (session!.id === id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await db.user.delete({ where: { id } });

    // BUG-019 FIX: Audit log for DELETE
    await db.auditLog.create({
      data: {
        userId: session!.id,
        username: session!.username,
        action: 'DELETE',
        module: 'USER',
        details: `Deleted user account @${user.username} (was ${user.role})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
