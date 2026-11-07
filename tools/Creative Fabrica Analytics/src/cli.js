import { parseArgs } from 'node:util';
import { runAuthFlow } from './auth.js';
import { collectStats } from './scraper.js';
import { syncToGit } from './git-sync.js';
import { runStealthVerification } from './stealth-check.js';

const optionsConfig = {
  auth: { type: 'boolean', short: 'a' },
  stats: { type: 'boolean', short: 's' },
  headless: { type: 'boolean', short: 'h', default: false },
  sync: { type: 'boolean', default: false },
  'verify-stealth': { type: 'boolean' },
  help: { type: 'boolean' },
};

function printHelp() {
  console.log(`
Creative Fabrica Analytics & Automation CLI
-------------------------------------------
Использование:
  node src/cli.js [опции]

Опции:
  -a, --auth            Интерактивный вход в Creative Fabrica (всегда в видимом окне)
  -s, --stats           Сбор статистики и метрик (по умолчанию активен)
  -h, --headless        Запуск в headless режиме (по умолчанию: false)
      --sync            Автоматически закоммитить и запушить отчеты в GitHub
      --verify-stealth  Проверить фингерпринт браузера и обход детекта
      --help            Показать справку

Примеры:
  npm run auth             # Первый ручной вход для сохранения сессии
  npm run stats            # Сбор метрик в видимом окне
  npm run stats:headless   # Сбор метрик в фоне
  npm run sync             # Сбор метрик + авто-пуш в репозиторий
`);
}

async function main() {
  try {
    const { values } = parseArgs({
      options: optionsConfig,
      allowPositionals: false,
      strict: false,
    });

    if (values.help) {
      printHelp();
      return;
    }

    if (values['verify-stealth']) {
      await runStealthVerification();
      return;
    }

    if (values.auth) {
      await runAuthFlow();
      return;
    }

    // Default action is stats collection
    const headless = Boolean(values.headless);
    await collectStats({ headless });

    if (values.sync) {
      await syncToGit();
    }
  } catch (error) {
    console.error(`\n❌ [ERROR] Ошибка выполнения: ${error.message}\n`);
    process.exit(1);
  }
}

main();
