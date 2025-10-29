/**
 * Test All Lambda Functions Locally
 * Runs all 5 Lambda functions with test files
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

const tests = [
  { name: 'word-to-pdf', file: 'sample.docx', description: 'Word to PDF' },
  { name: 'ppt-to-pdf', file: 'sample.pptx', description: 'PowerPoint to PDF' },
  { name: 'pdf-to-word', file: 'sample.pdf', description: 'PDF to Word' },
  { name: 'pdf-to-excel', file: 'sample.pdf', description: 'PDF to Excel' },
  { name: 'pdf-to-ppt', file: 'sample.pdf', description: 'PDF to PowerPoint' },
];

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║     🧪 TESTING ALL LAMBDA FUNCTIONS LOCALLY      ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const results = [];

  for (const test of tests) {
    const testFilePath = path.join(__dirname, 'test-files', test.file);
    
    console.log(`\n📋 Test ${results.length + 1}/5: ${test.description}`);
    console.log('─'.repeat(50));

    // Check if test file exists
    if (!fs.existsSync(testFilePath)) {
      console.log(`⚠️  Test file not found: ${testFilePath}`);
      console.log('   Skipping this test...\n');
      results.push({ name: test.name, status: 'SKIPPED', reason: 'Test file missing' });
      continue;
    }

    try {
      const command = `node test-lambda-local.js ${test.name} ${testFilePath}`;
      const { stdout, stderr } = await execAsync(command, { 
        cwd: __dirname,
        timeout: 60000 // 60 second timeout
      });
      
      if (stdout.includes('✅ TEST PASSED')) {
        console.log('✅ PASSED');
        results.push({ name: test.name, status: 'PASSED' });
      } else if (stdout.includes('❌ TEST FAILED')) {
        console.log('❌ FAILED');
        console.log(stdout);
        results.push({ name: test.name, status: 'FAILED', output: stdout });
      }
    } catch (error) {
      console.log('❌ ERROR');
      console.log(error.message);
      results.push({ name: test.name, status: 'ERROR', error: error.message });
    }
  }

  // Print summary
  console.log('\n\n╔════════════════════════════════════════════════════╗');
  console.log('║              📊 TEST SUMMARY                      ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;

  results.forEach((result, index) => {
    const icon = result.status === 'PASSED' ? '✅' : 
                 result.status === 'FAILED' ? '❌' : 
                 result.status === 'SKIPPED' ? '⏭️' : '⚠️';
    console.log(`${icon} ${result.name.padEnd(20)} ${result.status}`);
    if (result.reason) {
      console.log(`   Reason: ${result.reason}`);
    }
  });

  console.log('\n' + '─'.repeat(50));
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Errors: ${errors} ⚠️`);
  console.log(`Skipped: ${skipped} ⏭️`);
  console.log('─'.repeat(50) + '\n');

  if (passed === results.length - skipped) {
    console.log('🎉 ALL TESTS PASSED! 🎉\n');
  } else {
    console.log('⚠️  Some tests failed. Check output above.\n');
  }
}

runAllTests().catch(console.error);








