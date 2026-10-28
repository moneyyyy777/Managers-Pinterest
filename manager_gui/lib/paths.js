import path from 'path';
import fs from 'fs';

/**
 * Returns the absolute path to the workspace root directory.
 */
export function getProjectRoot() {
  if (process.env.PROJECT_ROOT) {
    return path.resolve(process.env.PROJECT_ROOT);
  }
  const cwd = process.cwd();
  // If running from inside manager_gui/
  if (fs.existsSync(path.join(cwd, 'Websites', 'CloudFlare', 'artify-studio'))) {
    return cwd;
  }
  const parent = path.resolve(cwd, '..');
  if (fs.existsSync(path.join(parent, 'Websites', 'CloudFlare', 'artify-studio'))) {
    return parent;
  }
  return cwd;
}

export function getContentDir() {
  return path.join(getProjectRoot(), 'Websites', 'CloudFlare', 'artify-studio', 'content');
}

export function getKeywordsDir() {
  return path.join(getProjectRoot(), 'Keywords', 'Artify Studio');
}

export function getAllFoldersDir() {
  return path.join(getProjectRoot(), 'All Folders');
}

export function getGeneratorsDir() {
  return path.join(getProjectRoot(), 'All Folders', '!Generators');
}

export function getPromptTemplatesPath() {
  return path.join(getProjectRoot(), 'PROMPT_TEMPLATES.md');
}

export function getCustomPromptsFilePath() {
  const root = getProjectRoot();
  const candidates = [
    path.join(root, 'manager_gui', 'data', 'custom_prompts.json'),
    path.join(process.cwd(), 'data', 'custom_prompts.json'),
    path.join(process.cwd(), 'manager_gui', 'data', 'custom_prompts.json')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

/**
 * Normalizes string for fuzzy/token matching
 */
function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getTokens(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Finds the corresponding folder in Keywords/Artify Studio/ for a given category and collection
 */
export function findKeywordFolder(category, collection) {
  const keywordsDir = getKeywordsDir();
  if (!fs.existsSync(keywordsDir)) return null;

  const catDirs = fs.readdirSync(keywordsDir).filter(
    (d) => !d.startsWith('.') && fs.statSync(path.join(keywordsDir, d)).isDirectory()
  );
  const normCat = normalize(category);
  const matchedCat = catDirs.find((d) => normalize(d) === normCat);
  if (!matchedCat) return null;

  const catPath = path.join(keywordsDir, matchedCat);
  const collDirs = fs.readdirSync(catPath).filter(
    (d) =>
      !d.startsWith('.') &&
      !d.includes('— копия') &&
      !d.includes('- copy') &&
      fs.statSync(path.join(catPath, d)).isDirectory()
  );
  const normColl = normalize(collection);

  // 1. Exact normalized match
  let matchedColl = collDirs.find((d) => normalize(d) === normColl);

  // 2. Direct containment match (e.g. "japanesefonts" contains "japanese" or vice versa)
  if (!matchedColl) {
    const subMatches = collDirs.filter((d) => {
      const nd = normalize(d);
      return nd && (normColl.includes(nd) || nd.includes(normColl));
    });
    if (subMatches.length > 0) {
      subMatches.sort((a, b) => normalize(b).length - normalize(a).length);
      matchedColl = subMatches[0];
    }
  }

  // 3. Token match filtering out generic category tokens (e.g. "fonts")
  if (!matchedColl) {
    const catTokens = new Set(getTokens(category));
    const tokensA = getTokens(collection).filter(
      (t) => !catTokens.has(t) && t !== normCat
    );

    let bestScore = 0;
    let bestDir = null;

    for (const d of collDirs) {
      const tokensB = getTokens(d).filter(
        (t) => !catTokens.has(t) && t !== normCat
      );
      const common = tokensA.filter((w) => tokensB.includes(w));
      const score =
        common.length / Math.max(tokensA.length || 1, tokensB.length || 1);
      if (score > bestScore && score >= 0.5) {
        bestScore = score;
        bestDir = d;
      }
    }
    if (bestDir) {
      matchedColl = bestDir;
    }
  }

  if (matchedColl) {
    return path.join(catPath, matchedColl);
  }
  return null;
}
