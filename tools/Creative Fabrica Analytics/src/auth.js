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
      const hasLogoutLink = Boolean(document.querySelector('a[href*="logout"]'));
      const hasAccountAvatar = Boolean(document.querySelector('.user-avatar, .account-menu, .header-user, a[href*="/my-account/"], a[href*="/affiliate-area/"]'));
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
    console.log(`[AUTH] Открытие страницы партнёрского кабинета: ${CF_URLS.affiliateOverview}`);
    await page.goto(CF_URLS.affiliateOverview, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await randomDelay(1500, 2500);

    // Initial check
    const alreadyLogged = await checkAuthStatus(page);
    if (alreadyLogged && !page.url().includes('/login')) {
      console.log('✅ [AUTH] Вы уже авторизованы в партнёрском кабинете!');
    } else {
      console.log('\n👉 Пожалуйста, войдите в аккаунт Creative Fabrica в открывшемся окне браузера.');
      console.log('👉 После успешного входа нажмите [ENTER] в этой консоли.\n');

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      await new Promise((resolve) => {
        let detectedInterval = null;

        const cleanup = () => {
          if (detectedInterval) clearInterval(detectedInterval);
          rl.close();
        };

        // Poll every 3s in background to see if user succeeded
        detectedInterval = setInterval(async () => {
          const ok = await checkAuthStatus(page);
          if (ok && !page.url().includes('/login')) {
            console.log('\n⚡ [AUTH] Автоматически обнаружен успешный вход в кабинет!');
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
      console.log('🎉 [AUTH] Авторизация подтверждена и надежно сохранена в .browser_profile!');
    } else {
      console.log('⚠️ [AUTH] Предупреждение: статус входа не определен однозначно. Проверьте окно браузера.');
    }

  } finally {
    await context.close();
    console.log('[AUTH] Браузер закрыт. Профиль синхронизирован на диске.\n');
  }
}
