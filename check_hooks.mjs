import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    const content = fs.readFileSync(filePath, 'utf8');
    const isClient = content.includes('"use client"') || content.includes("'use client'");
    
    if (!isClient) {
      const usesHook = content.match(/use(State|Effect|Context|Ref|Memo|Callback|Router|Pathname|SearchParams)\b/);
      if (usesHook) {
        console.log(`MISSING 'use client': ${filePath} uses ${usesHook[0]}`);
      }
    }
  }
});
