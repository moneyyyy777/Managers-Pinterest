import { NextResponse } from 'next/server';

export async function GET() {
  const adminUrl = 'http://localhost:3333';
  let running = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(adminUrl, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok || res.status < 500) {
      running = true;
    }
  } catch (err) {
    running = false;
  }

  return NextResponse.json({
    running,
    url: adminUrl,
    checkedAt: new Date().toISOString()
  });
}
