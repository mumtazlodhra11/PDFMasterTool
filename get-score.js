import fs from 'fs';
const html = fs.readFileSync('lighthouse-final-score.html', 'utf8');

// Try to find score in JSON data
const jsonMatch = html.match(/"categories":\s*\{[^}]*"performance":\s*\{[^}]*"score":\s*(\d+(?:\.\d+)?)/);
if (jsonMatch) {
  const score = Math.round(parseFloat(jsonMatch[1]) * 100);
  console.log(`Performance Score: ${score}%`);
} else {
  // Try alternative pattern
  const altMatch = html.match(/Performance.*?(\d+)/i);
  if (altMatch) {
    console.log(`Performance Score: ${altMatch[1]}%`);
  } else {
    console.log('Score not found in report');
  }
}

