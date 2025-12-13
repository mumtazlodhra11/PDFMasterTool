// Quick Node.js script to remove JSX options props from tool files

const fs = require('fs');
const path = require('path');

const toolsDir = './src/pages/tools';
const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.astro'));

let fixedCount = 0;
let errorCount = 0;

console.log('\n🔧 Removing JSX options props from tool files...\n');

files.forEach(file => {
  const filepath = path.join(toolsDir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  
  if (!content.includes('options={')) {
    console.log(`✓ ${file} - Already clean`);
    return;
  }
  
  // Find the options block - it starts with "options={" and ends with matching "}"
  // Then is followed by either ">" or more props before ">"
  
  const lines = content.split('\n');
  let newLines = [];
  let inOptionsBlock = false;
  let braceCount = 0;
  let skipNextLines = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('options={') && !inOptionsBlock) {
      // Start of options block
      inOptionsBlock = true;
      braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      
      // Skip this line
      continue;
    }
    
    if (inOptionsBlock) {
      // Count braces
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      // If braces are balanced and line contains "}", we're done
      if (braceCount === 0 && line.includes('}')) {
        inOptionsBlock = false;
        // Skip this line (it's just the closing })
        continue;
      }
      
      // Skip lines inside options block
      continue;
    }
    
    // Keep all other lines
    newLines.push(line);
  }
  
  const newContent = newLines.join('\n');
  
  try {
    fs.writeFileSync(filepath, newContent, 'utf8');
    console.log(`✅ ${file} - FIXED!`);
    fixedCount++;
  } catch (err) {
    console.log(`❌ ${file} - Error: ${err.message}`);
    errorCount++;
  }
});

console.log(`\n═══════════════════════════════════`);
console.log(`✅ Fixed: ${fixedCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`📊 Total: ${files.length}`);
console.log(`\n🎉 Done! Restart server now.\n`);















