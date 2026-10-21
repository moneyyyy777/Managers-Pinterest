// scripts/artify_sites_publishing/config.js
import path from 'path';

// 1. Корень проекта (папка artify-studio)
const PROJECT_ROOT = process.cwd();

// 2. Папка CloudFlare (на 1 уровень выше: .../Websites/CloudFlare)
const CLOUDFLARE_DIR = path.resolve(PROJECT_ROOT, '..');

// 3. Главная папка Managers Pinterest (на 3 уровня выше)
const PINTEREST_ROOT = path.resolve(PROJECT_ROOT, '../../..');

export const CONFIG = {
    MAIN_DOMAIN: "https://artify-studio.pages.dev",
    BRAND_NAME: "ARTIFY STUDIO",
    MAIN_ACCOUNT_EMAIL: "kalifornialover6@gmail.com",

    // 📊 Твой ID аккаунта в Google Analytics (Найди его в админке GA)
    GA_ACCOUNT_ID: "348799344",

    // Ссылка на твой Google Site шаблон (вставь сюда реальную ссылку на редактирование шаблона)
    GOOGLE_SITE_TEMPLATE_URL: "https://sites.google.com/d/1M8pCtp83q-dfD2_WtuYwE2bo0Pba1LJT/p/1Grm-VYVR2Yg6ylC_MOFRNVaDEfb6N_9e/edit?pli=1",
    
    CHROMIUM_PORT: 9222,
    
    CLOUDFLARE_ACCOUNTS: [
        { email: "kalifornia.lover7@gmail.com", maxSites: 150 },
        { email: "kalifornia.lover8@gmail.com", maxSites: 150 },
        { email: "kalifornia.lover9@gmail.com", maxSites: 150 }
    ],

    GMAIL_ACCOUNTS: [
        "kalifornia.lover3@gmail.com", 
        "kalifornia.lover4@gmail.com", 
        "kalifornia.lover5@gmail.com", 
        "kalifornia.lover6@gmail.com", 
        "kalifornia.lover8@gmail.com", 
        "kalifornia.lover9@gmail.com", 
        "loverkalifornia@gmail.com", 
        "kalifornia.lover777@gmail.com", 
        "kalifornia.lover.loops@gmail.com", 
        "krllseregin@gmail.com"
    ],

    // 📁 ТОЧНЫЕ ПУТИ ПО ТВОЕЙ СТРУКТУРЕ (Работают на Mac и Windows без правок!)
    PATHS: {
        PROJECT_ROOT: PROJECT_ROOT,
        PINTEREST_ROOT: PINTEREST_ROOT,
        
        // Лежит в Websites/CloudFlare/!Creative Fabrica HTMLs
        CF_HTMLS_DIR: path.join(CLOUDFLARE_DIR, '!Creative Fabrica HTMLs'),
        
        // Лежит в Websites/CloudFlare/analytics_g_rules.json
        ANALYTICS_RULES: path.join(CLOUDFLARE_DIR, 'analytics_g_rules.json'),
        
        // Базы лежат в Websites/CloudFlare/ рядом с artify-studio
        DB_JSON: path.join(CLOUDFLARE_DIR, 'cloudflare_accounts.json'),
        DB_TXT: path.join(CLOUDFLARE_DIR, 'Cloudflare accounts.txt'),

        // 🔥 Ключ лежит в Websites/CloudFlare/google-key.json
        GOOGLE_KEY: path.join(CLOUDFLARE_DIR, 'google-key.json'),
    }
};