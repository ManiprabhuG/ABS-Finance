import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, getSession } from '@/lib/auth';

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        branch: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const data = await request.json();

    if (!data.username || !data.password || !data.name || !data.role) {
      return NextResponse.json({ error: 'Username, Password, Name, and Role are required' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { username: data.username } });
    if (existing) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    const passHash = await hashPassword(data.password);

    const newUser = await db.user.create({
      data: {
        username: data.username,
        passwordHash: passHash,
        name: data.name,
        email: data.email || null,
        role: data.role,
        branch: data.branch || 'Main Branch',
        status: 'ACTIVE',
      },
    });

    await db.auditLog.create({
      data: {
        userId: session?.id,
        username: session?.username || 'System',
        action: 'CREATE',
        module: 'USER',
        details: `Created User ${newUser.username} with role ${newUser.role}`,
      },
    });

    return NextResponse.json({ success: true, user: { id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
