import { execSync } from 'child_process';
try {
  execSync('node scripts/creative-fabrica/generate-semantic-tags.js', { 
    input: "3\n6\n2\ny\n",
    stdio: ['pipe', 'inherit', 'inherit']
  });
} catch(e) {}
