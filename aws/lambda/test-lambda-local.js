/**
 * Local Lambda Function Tester
 * Test Lambda functions without deploying to AWS
 * 
 * Usage: node test-lambda-local.js [function-name]
 * Example: node test-lambda-local.js word-to-pdf
 */

const fs = require('fs');
const path = require('path');

// Mock event creator
function createMockEvent(fileContent, fileName) {
  return {
    body: JSON.stringify({
      fileContent: fileContent,
      fileName: fileName,
    }),
    requestContext: {
      http: {
        method: 'POST',
      },
    },
  };
}

// Test runner
async function testLambda(functionName, testFilePath) {
  console.log('\n================================');
  console.log(`🧪 Testing: ${functionName}`);
  console.log('================================\n');

  try {
    // Load Lambda function
    const lambdaPath = path.join(__dirname, `${functionName}.js`);
    if (!fs.existsSync(lambdaPath)) {
      throw new Error(`Lambda function not found: ${lambdaPath}`);
    }

    const lambda = require(lambdaPath);
    console.log('✅ Lambda function loaded\n');

    // Read test file
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Test file not found: ${testFilePath}`);
    }

    const fileBuffer = fs.readFileSync(testFilePath);
    const base64Content = fileBuffer.toString('base64');
    const fileName = path.basename(testFilePath);

    console.log(`📁 Test file: ${fileName}`);
    console.log(`📊 File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`📦 Base64 size: ${(base64Content.length / 1024).toFixed(2)} KB\n`);

    // Create mock event
    const event = createMockEvent(base64Content, fileName);

    // Call Lambda handler
    console.log('⏳ Processing...\n');
    const startTime = Date.now();
    const response = await lambda.handler(event);
    const duration = Date.now() - startTime;

    // Parse response
    const result = JSON.parse(response.body);

    if (response.statusCode === 200 && result.success) {
      console.log('✅ SUCCESS!\n');
      console.log(`⏱️  Processing time: ${duration}ms`);
      console.log(`📄 Output file: ${result.fileName}`);
      console.log(`📊 Output size: ${(result.fileSize / 1024).toFixed(2)} KB`);

      // Save output file
      if (result.fileContent) {
        const outputBuffer = Buffer.from(result.fileContent, 'base64');
        const outputPath = path.join(__dirname, 'test-output', result.fileName);
        
        // Create output directory
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, outputBuffer);
        console.log(`💾 Saved to: ${outputPath}\n`);
      }

      console.log('================================');
      console.log('✅ TEST PASSED');
      console.log('================================\n');
    } else {
      console.log('❌ FAILED!\n');
      console.log(`Status: ${response.statusCode}`);
      console.log(`Error: ${result.error}\n`);
      console.log('================================');
      console.log('❌ TEST FAILED');
      console.log('================================\n');
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    console.log('\n================================');
    console.log('❌ TEST FAILED');
    console.log('================================\n');
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n📖 Usage: node test-lambda-local.js [function-name] [test-file]\n');
    console.log('Available functions:');
    console.log('  • word-to-pdf');
    console.log('  • ppt-to-pdf');
    console.log('  • pdf-to-word');
    console.log('  • pdf-to-excel');
    console.log('  • pdf-to-ppt\n');
    console.log('Examples:');
    console.log('  node test-lambda-local.js word-to-pdf test-files/sample.docx');
    console.log('  node test-lambda-local.js pdf-to-word test-files/sample.pdf\n');
    process.exit(1);
  }

  const functionName = args[0];
  const testFilePath = args[1] || path.join(__dirname, 'test-files', getDefaultTestFile(functionName));

  await testLambda(functionName, testFilePath);
}

function getDefaultTestFile(functionName) {
  const defaults = {
    'word-to-pdf': 'sample.docx',
    'ppt-to-pdf': 'sample.pptx',
    'pdf-to-word': 'sample.pdf',
    'pdf-to-excel': 'sample.pdf',
    'pdf-to-ppt': 'sample.pdf',
  };
  return defaults[functionName] || 'sample.pdf';
}

main().catch(console.error);






