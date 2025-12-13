#!/usr/bin/env node
/**
 * Lighthouse Test Script for PDFMasterTool
 * Tests multiple pages and generates reports
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const baseUrl = process.env.LIGHTHOUSE_URL || 'http://localhost:9001';
const outputDir = 'lighthouse-reports';

// Create output directory
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Pages to test
const pages = [
  { name: 'home', url: '/' },
  { name: 'merge-pdf', url: '/tools/merge-pdf' },
  { name: 'split-pdf', url: '/tools/split-pdf' },
  { name: 'compress-pdf', url: '/tools/compress-pdf' },
  { name: 'pdf-to-word', url: '/tools/pdf-to-word' },
  { name: 'word-to-pdf', url: '/tools/word-to-pdf' },
  { name: 'pdf-to-excel', url: '/tools/pdf-to-excel' },
  { name: 'excel-to-pdf', url: '/tools/excel-to-pdf' },
  { name: 'edit-pdf', url: '/tools/edit-pdf' },
  { name: 'ai-ocr', url: '/tools/ai-ocr' },
];

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

console.log('🔍 Starting Lighthouse Audit...\n');
console.log(`📊 Testing ${pages.length} pages...\n`);

const results = [];

for (const page of pages) {
  const fullUrl = `${baseUrl}${page.url}`;
  const outputFile = join(outputDir, `${page.name}-${timestamp}`);
  
  console.log(`🔍 Testing: ${page.name} (${fullUrl})`);
  
  try {
    // Run Lighthouse
    const command = `lighthouse "${fullUrl}" --output=json,html --output-path="${outputFile}" --chrome-flags="--headless --no-sandbox" --only-categories=performance,accessibility,best-practices,seo --quiet`;
    
    execSync(command, { stdio: 'inherit' });
    
    // Read and parse results
    const jsonFile = `${outputFile}.report.json`;
    if (existsSync(jsonFile)) {
      const json = JSON.parse(readFileSync(jsonFile, 'utf8'));
      const perf = Math.round(json.categories.performance.score * 100);
      const a11y = Math.round(json.categories.accessibility.score * 100);
      const best = Math.round(json.categories['best-practices'].score * 100);
      const seo = Math.round(json.categories.seo.score * 100);
      
      results.push({
        page: page.name,
        url: page.url,
        performance: perf,
        accessibility: a11y,
        bestPractices: best,
        seo: seo,
        average: Math.round((perf + a11y + best + seo) / 4),
      });
      
      console.log(`   ✅ Performance: ${perf} | Accessibility: ${a11y} | Best Practices: ${best} | SEO: ${seo}\n`);
    } else {
      console.log(`   ⚠️  JSON report not found\n`);
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }
}

// Generate summary report
const summary = {
  timestamp: new Date().toISOString(),
  baseUrl,
  totalPages: pages.length,
  results,
  averages: {
    performance: Math.round(results.reduce((sum, r) => sum + r.performance, 0) / results.length),
    accessibility: Math.round(results.reduce((sum, r) => sum + r.accessibility, 0) / results.length),
    bestPractices: Math.round(results.reduce((sum, r) => sum + r.bestPractices, 0) / results.length),
    seo: Math.round(results.reduce((sum, r) => sum + r.seo, 0) / results.length),
  },
};

const summaryFile = join(outputDir, `summary-${timestamp}.json`);
writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

console.log('✅ Lighthouse audit complete!\n');
console.log('📊 Summary:');
console.log(`   Average Performance: ${summary.averages.performance}`);
console.log(`   Average Accessibility: ${summary.averages.accessibility}`);
console.log(`   Average Best Practices: ${summary.averages.bestPractices}`);
console.log(`   Average SEO: ${summary.averages.seo}\n`);
console.log(`📁 Reports saved in: ${outputDir}`);
console.log(`📄 Summary: ${summaryFile}`);
console.log('\n💡 Open HTML files in browser to view detailed reports');

