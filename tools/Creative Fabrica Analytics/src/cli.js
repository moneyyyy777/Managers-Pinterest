import { parseArgs } from 'node:util';
import { runAuthFlow } from './auth.js';
import { collectGranularStats } from './scraper.js';
import { runAnalytics } from './analytics.js';
import { processDailyAnalytics } from './analyzer.js';
import { syncToGit } from './git-sync.js';
import { runStealthVerification } from './stealth-check.js';

const optionsConfig = {
  auth: { type: 'boolean', short: 'a' },
  stats: { type: 'boolean', short: 's' },
  incremental: { type: 'boolean', short: 'i', default: false },
  restart: { type: 'boolean', default: false },
  analyze: { type: 'boolean' },
  'no-analyze': { type: 'boolean', default: false },
  headless: { type: 'boolean', short: 'h', default: false },
  sync: { type: 'boolean', default: false },
  pages: { type: 'string', default: '10' },
  'verify-stealth': { type: 'boolean' },
  help: { type: 'boolean' },
};

function printHelp() {
  console.log(`
Creative Fabrica Affiliate Analytics CLI
----------------------------------------
Использование:
  node src/cli.js [опции]

Опции:
  -a, --auth            Интерактивный вход в Creative Fabrica (в видимом окне)
  -s, --stats           Сбор данных (Referrals + Visits + API)
  -i, --incremental     ⚡ Инкрементальный режим: собирать только новые данные
      --restart         Сбросить точку возобновления и начать строго со стр. 1
      --no-analyze      Собрать только сырые данные без вывода аналитики
      --analyze         Анализ уже сохраненных данных без запуска браузера
  -h, --headless        Запуск браузера в фоне (по умолчанию: false)
      --pages <N|all>   Количество страниц пагинации (по умолчанию: 10, или 'all' для всех)
      --sync            Автоматически закоммитить и запушить отчеты в GitHub
      --verify-stealth  Проверить фингерпринт браузера и обход детекта
      --help            Показать справку

Примеры:
  npm run scrape:all          # Выгрузить ВСЮ историю за все время без аналитики
  npm run stats -- --pages all# Собрать ВСЕ страницы за все время + сразу запустить аналитику
  npm run analyze             # Запустить аналитику по сохраненной базе в любой момент
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

    if (values.analyze) {
      processDailyAnalytics();
      runAnalytics();
      return;
    }

    const headless = Boolean(values.headless);
    const incremental = Boolean(values.incremental);
    const restart = Boolean(values.restart);
    const pagesArg = String(values.pages || '10').toLowerCase();
    const maxPages = pagesArg === 'all' || pagesArg === '0' ? 0 : parseInt(pagesArg, 10);
    const skipAnalytics = Boolean(values['no-analyze']);

    await collectGranularStats({ headless, maxPages, incremental, restart });

    if (!skipAnalytics) {
      processDailyAnalytics();
      runAnalytics();
    } else {
      console.log('ℹ️ [CLI] Аналитика пропущена (флаг --no-analyze). Сырые данные сохранены в master-database.json и latest.json.');
      console.log('👉 Чтобы запустить аналитику позже: npm run analyze\n');
    }

    if (values.sync) {
      await syncToGit();
    }
  } catch (error) {
    console.error(`\n❌ [ERROR] Ошибка выполнения: ${error.message}\n`);
    process.exit(1);
  }
}

main();
