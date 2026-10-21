const fs = require('fs');

const data = JSON.parse(fs.readFileSync('content/cliparts/baby/all_products.json', 'utf8'));

// Скопировано из [collection].astro
const levenshtein = (a, b) => {
    if(a.length === 0) return b.length;
    if(b.length === 0) return a.length;
    var matrix = [];
    for(var i = 0; i <= b.length; i++) matrix[i] = [i];
    for(var j = 0; j <= a.length; j++) matrix[0][j] = j;
    for(var i = 1; i <= b.length; i++) {
        for(var j = 1; j <= a.length; j++) {
            if(b.charAt(i-1) === a.charAt(j-1)) matrix[i][j] = matrix[i-1][j-1];
            else matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
        }
    }
    return matrix[b.length][a.length];
};

const fuzzyMatchScore = (query, text) => {
    if (!query || !text) return 0;
    query = query.toLowerCase();
    text = text.toLowerCase();
    if (text.includes(query)) return 30; 
    
    const queryWords = query.split(/\s+/).filter(w => w.length > 0);
    const textWords = text.replace(/[,.-]/g, ' ').split(/\s+/).filter(w => w.length > 0);
    
    let allMatched = true;
    let score = 0;

    for (let qw of queryWords) {
        let wordMatched = false;
        if (textWords.some(tw => tw.includes(qw))) {
            wordMatched = true;
            score += 20;
        } 
        else if (qw.length >= 4) {
            const maxDist = qw.length >= 6 ? 2 : 1; 
            for (let tw of textWords) {
                if (Math.abs(tw.length - qw.length) <= maxDist) {
                    const dist = levenshtein(qw, tw);
                    if (dist <= maxDist) {
                        wordMatched = true;
                        score += 10;
                        break;
                    }
                }
            }
        }
        if (!wordMatched) {
            allMatched = false;
            break;
        }
    }
    return allMatched ? score : 0;
};

const runSearch = (currentSearch) => {
    currentSearch = currentSearch.toLowerCase();
    const results = data.map(product => {
        let score = 0;
        const itemTitle = (product.title || '').toLowerCase();
        const itemSemantic = ((product.semanticTags || []).join(' ')).toLowerCase();
        const itemDesc = (product.description || '').toLowerCase();
        const itemFullDesc = (product.fullDescription || '').toLowerCase();

        const titleScore = fuzzyMatchScore(currentSearch, itemTitle);
        const semanticScore = fuzzyMatchScore(currentSearch, itemSemantic);
        const descScore = fuzzyMatchScore(currentSearch, itemDesc);
        const fullDescScore = fuzzyMatchScore(currentSearch, itemFullDesc);

        if (titleScore > 0) {
            score += titleScore * 3;
            if (itemTitle.startsWith(currentSearch)) score += 15;
        }
        if (semanticScore > 0) {
            score += semanticScore * 2;
        }
        if (descScore > 0) {
            score += Math.floor(descScore * 0.5);
        }
        if (fullDescScore > 0) {
            score += Math.floor(fullDescScore * 0.25);
        }

        return { title: product.title, score };
    }).filter(p => p.score > 0).sort((a, b) => b.score - a.score);

    console.log(`\n🔍 ЗАПРОС: "${currentSearch}" (Найдено: ${results.length})`);
    results.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i+1}. [Очки: ${r.score}] ${r.title}`);
    });
    if (results.length === 0) console.log("  Ничего не найдено.");
};

const queries = ['pink', 'boy', 'animal', 'boho', 'duck'];
queries.forEach(runSearch);
