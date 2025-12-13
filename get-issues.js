import fs from 'fs';
const html = fs.readFileSync('lighthouse-final-score.html', 'utf8');

// Extract JSON data from Lighthouse report
const jsonMatch = html.match(/<script id="__LIGHTHOUSE_JSON__" type="application\/json">(.*?)<\/script>/s);
if (jsonMatch) {
  const data = JSON.parse(jsonMatch[1]);
  
  // Get performance score
  const perfScore = Math.round((data.categories?.performance?.score || 0) * 100);
  console.log(`\n📊 Performance Score: ${perfScore}%\n`);
  
  // Get failed audits
  const audits = data.audits || {};
  const failedAudits = Object.entries(audits)
    .filter(([key, audit]) => audit.score !== null && audit.score < 0.9)
    .sort((a, b) => (b[1].score || 0) - (a[1].score || 0))
    .slice(0, 10);
  
  console.log('🔴 Top Issues to Fix:\n');
  failedAudits.forEach(([key, audit], index) => {
    const score = Math.round((audit.score || 0) * 100);
    const impact = audit.details?.overallSavingsMs || audit.details?.overallSavingsBytes || 0;
    console.log(`${index + 1}. ${audit.title}`);
    console.log(`   Score: ${score}%`);
    if (audit.displayValue) console.log(`   ${audit.displayValue}`);
    if (impact > 0) console.log(`   Potential Savings: ${impact}`);
    console.log('');
  });
  
  // Get metrics
  console.log('\n📈 Key Metrics:\n');
  const metrics = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'];
  metrics.forEach(key => {
    const metric = audits[key];
    if (metric) {
      const value = metric.numericValue || metric.displayValue || 'N/A';
      const score = metric.score !== null ? Math.round(metric.score * 100) : 'N/A';
      console.log(`${metric.title}: ${value} (Score: ${score}%)`);
    }
  });
}









