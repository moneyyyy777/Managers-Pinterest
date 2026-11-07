import readline from 'node:readline';
import { launchBrowser, randomDelay } from './browser.js';
import { CF_URLS } from './config.js';

/**
 * Checks if user is authenticated on Creative Fabrica
 * @param {import('playwright').Page} page 
 */
export async function checkAuthStatus(page) {
  try {
    const isLogged = await page.evaluate(() => {
      // Common indicators of an authenticated CF session
      const hasLogoutLink = Boolean(document.querySelector('a[href*="logout"]'));
      const hasAccountAvatar = Boolean(document.querySelector('.user-avatar, .account-menu, .header-user, a[href*="/my-account/"]'));
      const isLoginUrl = window.location.pathname.includes('/login');
      return (hasLogoutLink || hasAccountAvatar) && !isLoginUrl;
    });
    return isLogged;
  } catch {
    return false;
  }
}

/**
 * Interactive login helper
 */
export async function runAuthFlow() {
  console.log('\n======================================================');
  console.log('🔑 [AUTH] Запуск интерактивного режима авторизации');
  console.log('   Браузер запустится в видимом окне (headless: false).');
  console.log('   Все куки и токены сохранятся в постоянный профиль.');
  console.log('======================================================\n');

  const { context, page } = await launchBrowser({ headless: false });

  try {
    console.log(`[AUTH] Переход на страницу входа: ${CF_URLS.login}`);
    await page.goto(CF_URLS.login, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await randomDelay(1500, 2500);

    // Initial check
    const alreadyLogged = await checkAuthStatus(page);
    if (alreadyLogged) {
      console.log('✅ [AUTH] Вы уже авторизованы в этом профиле!');
    } else {
      console.log('\n👉 Пожалуйста, войдите в аккаунт в открывшемся окне браузера.');
      console.log('👉 После успешного входа нажмите [ENTER] в этой консоли.\n');

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // Wait for user confirmation or auto-detection
      await new Promise((resolve) => {
        let detectedInterval = null;

        const cleanup = () => {
          if (detectedInterval) clearInterval(detectedInterval);
          rl.close();
        };

        // Poll every 3s in background to see if user succeeded
        detectedInterval = setInterval(async () => {
          const ok = await checkAuthStatus(page);
          if (ok) {
            console.log('\n⚡ [AUTH] Автоматически обнаружен успешный вход!');
            cleanup();
            resolve();
          }
        }, 3000);

        rl.question('Нажмите [ENTER], когда авторизуетесь: ', () => {
          cleanup();
          resolve();
        });
      });
    }

    console.log('[AUTH] Сохранение состояния профиля...');
    await randomDelay(1000, 2000);

    const finalCheck = await checkAuthStatus(page);
    if (finalCheck) {
      console.log('🎉 [AUTH] Авторизация подтверждена и надежно сохранена!');
    } else {
      console.log('⚠️ [AUTH] Не удалось подтвердить статус авторизации. Проверьте профиль перед автоматическим сбором.');
    }

  } finally {
    await context.close();
    console.log('[AUTH] Браузер закрыт. Профиль синхронизирован на диске.\n');
  }
}
