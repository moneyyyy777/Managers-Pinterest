import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root directory of the tool
export const TOOL_ROOT = path.resolve(__dirname, '..');

// Workspace root (Managers Pinterest)
export const WORKSPACE_ROOT = path.resolve(TOOL_ROOT, '..', '..');

// Persistent browser profile directory (isolated for Creative Fabrica)
export const PROFILE_DIR = path.join(TOOL_ROOT, '.browser_profile');

// Data directories
export const DATA_DIR = path.join(TOOL_ROOT, 'data');
export const REPORTS_DIR = path.join(DATA_DIR, 'reports');
export const SCREENSHOTS_DIR = path.join(DATA_DIR, 'screenshots');

// Creative Fabrica URLs
export const CF_URLS = {
  home: 'https://www.creativefabrica.com/',
  login: 'https://www.creativefabrica.com/login/',
  myAccount: 'https://www.creativefabrica.com/my-account/',
  designerDashboard: 'https://www.creativefabrica.com/designer-dashboard/',
  designerStats: 'https://www.creativefabrica.com/designer-dashboard/statistics/',
  designerEarnings: 'https://www.creativefabrica.com/designer-dashboard/earnings/',
};

// Default browser configuration
export const BROWSER_CONFIG = {
  viewport: { width: 1440, height: 900 },
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  locale: 'en-US',
  timezoneId: 'America/New_York',
  defaultHeadless: false, // Default is false as requested for comfortable debugging & testing
};
