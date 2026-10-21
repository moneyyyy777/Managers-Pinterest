import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function checkService(url, timeoutMs = 1500) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timer);

    return res.ok || res.status < 500;
  } catch (err) {
    return false;
  }
}

export async function GET() {
  const [adminRunning, siteRunning, browserRunning, streamlitRunning] = await Promise.all([
    checkService('http://127.0.0.1:3333/api/health', 1200),
    checkService('http://127.0.0.1:4321', 1200),
    checkService('http://127.0.0.1:9222/json/version', 1200),
    checkService('http://127.0.0.1:8501', 1200)
  ]);

  return NextResponse.json({
    admin: {
      id: 'admin',
      name: 'Визуальная админка',
      running: adminRunning,
      port: 3333,
      url: 'http://localhost:3333'
    },
    site: {
      id: 'site',
      name: 'Локальный сайт',
      running: siteRunning,
      port: 4321,
      url: 'http://localhost:4321'
    },
    manager: {
      id: 'manager',
      name: 'Менеджер тегов & Студия',
      running: true,
      port: 3001,
      url: 'http://localhost:3001'
    },
    browser: {
      running: browserRunning,
      port: 9222,
      url: 'https://aistudio.google.com'
    },
    streamlit: {
      running: streamlitRunning,
      port: 8501,
      url: 'http://localhost:8501'
    }
  });
}
