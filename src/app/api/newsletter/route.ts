import { NextRequest, NextResponse } from 'next/server';
import { subscribeToNewsletter } from '@/lib/actions/community';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Etibarlı e-poçt ünvanı daxil edin.' }, { status: 400 });
    }

    const result = await subscribeToNewsletter(email);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Abunə xətası' }, { status: 500 });
    }

    return NextResponse.json({ success: true, alreadySubscribed: result.alreadySubscribed || false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server xətası' }, { status: 500 });
  }
}
