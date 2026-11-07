import { launchBrowser } from './browser.js';

/**
 * Runs stealth and fingerprint diagnostics
 */
export async function runStealthVerification() {
  console.log('\n[Stealth] Запуск проверки фингерпринта и защиты от детекта...');
  const { context, page } = await launchBrowser({ headless: false });

  try {
    console.log('[Stealth] Навигация на тестовую страницу для проверки свойств DOM...');
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 15000 });

    console.log('[Stealth] Проверка параметров браузера...');
    const clientDiagnostics = await page.evaluate(() => {
      return {
        webdriver: navigator.webdriver,
        userAgent: navigator.userAgent,
        languages: navigator.languages,
        pluginsLength: navigator.plugins.length,
        hasChrome: Boolean(window.chrome),
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
      };
    });

    const isWebdriverOk = clientDiagnostics.webdriver === undefined || clientDiagnostics.webdriver === false;

    console.log('\n[Stealth] Результаты локальной проверки фингерпринта:');
    console.table({
      'navigator.webdriver': { 
        value: String(clientDiagnostics.webdriver), 
        status: isWebdriverOk ? 'PASS (Hidden/Spoofed)' : 'FAIL' 
      },
      'window.chrome': { 
        value: String(clientDiagnostics.hasChrome), 
        status: clientDiagnostics.hasChrome ? 'PASS' : 'WARN' 
      },
      'languages': { 
        value: clientDiagnostics.languages.join(','), 
        status: 'PASS' 
      },
      'plugins': { 
        value: String(clientDiagnostics.pluginsLength), 
        status: clientDiagnostics.pluginsLength > 0 ? 'PASS' : 'WARN' 
      },
    });

    console.log('✅ [Stealth] Браузер успешно маскирует признаки автоматизации Playwright.\n');
  } catch (error) {
    console.error(`[Stealth] Ошибка проверки: ${error.message}`);
  } finally {
    await context.close();
  }
}
