#!/usr/bin/env node
/**
 * PDFMasterTool - Lambda Functions Test Client
 * Simple CLI tool to test Lambda conversion functions
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Lambda Function URLs
const LAMBDA_URLS = {
    'ppt-to-pdf': 'https://kjvlahhbpn5vgcz65eyp4as22m0qeytt.lambda-url.eu-west-1.on.aws/',
    'pdf-to-word': 'https://xxr3sbwwhdjfanfdbaqwvsg2ea0bvzzk.lambda-url.eu-west-1.on.aws/',
    'pdf-to-excel': 'https://odxspqynwszdskoxt7ml2urbjq0qddvh.lambda-url.eu-west-1.on.aws/',
    'pdf-to-ppt': 'https://mxw5nxnwmsic4yflfnevu4aapa0dxqbq.lambda-url.eu-west-1.on.aws/',
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function convertFile(operation, inputFilePath) {
    console.log(`\n🚀 Starting conversion: ${operation}`);
    console.log(`📁 Input file: ${inputFilePath}`);
    
    // Check if file exists
    if (!fs.existsSync(inputFilePath)) {
        throw new Error(`File not found: ${inputFilePath}`);
    }
    
    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(inputFilePath);
    const base64Content = fileBuffer.toString('base64');
    const fileName = path.basename(inputFilePath);
    
    console.log(`📦 File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`🔄 Sending to Lambda...`);
    
    // Get Lambda URL
    const lambdaUrl = LAMBDA_URLS[operation];
    if (!lambdaUrl) {
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    // Prepare request payload
    const payload = {
        fileContent: base64Content,
        fileName: fileName
    };
    
    // Send request
    const startTime = Date.now();
    
    try {
        const response = await fetch(lambdaUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`⏱️  Request took: ${duration}s`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Lambda returned ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.success === false || result.error) {
            throw new Error(result.error || 'Conversion failed');
        }
        
        // Check if we have converted file data
        if (result.fileContent || result.data) {
            const outputBase64 = result.fileContent || result.data;
            const outputFileName = result.fileName || `converted_${Date.now()}.${getOutputExtension(operation)}`;
            const outputPath = path.join(process.cwd(), outputFileName);
            
            // Write output file
            const outputBuffer = Buffer.from(outputBase64, 'base64');
            fs.writeFileSync(outputPath, outputBuffer);
            
            console.log(`✅ Conversion successful!`);
            console.log(`💾 Output saved: ${outputPath}`);
            console.log(`📦 Output size: ${(outputBuffer.length / 1024).toFixed(2)} KB`);
            
            return {
                success: true,
                outputPath,
                duration
            };
        } else {
            console.log(`✅ Response received:`, JSON.stringify(result, null, 2));
            return {
                success: true,
                result,
                duration
            };
        }
        
    } catch (error) {
        console.error(`❌ Conversion failed:`, error.message);
        throw error;
    }
}

function getOutputExtension(operation) {
    const extensions = {
        'ppt-to-pdf': 'pdf',
        'pdf-to-word': 'docx',
        'pdf-to-excel': 'xlsx',
        'pdf-to-ppt': 'pptx'
    };
    return extensions[operation] || 'bin';
}

async function main() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║  PDFMasterTool - Lambda Test Client   ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    
    // Show available operations
    console.log('Available operations:');
    console.log('  1. PPT to PDF');
    console.log('  2. PDF to Word');
    console.log('  3. PDF to Excel');
    console.log('  4. PDF to PowerPoint');
    console.log('');
    
    try {
        // Get operation choice
        const choice = await question('Select operation (1-4): ');
        
        const operations = {
            '1': 'ppt-to-pdf',
            '2': 'pdf-to-word',
            '3': 'pdf-to-excel',
            '4': 'pdf-to-ppt'
        };
        
        const operation = operations[choice];
        if (!operation) {
            console.error('❌ Invalid choice!');
            rl.close();
            return;
        }
        
        // Get file path
        const filePath = await question('Enter file path: ');
        
        // Perform conversion
        await convertFile(operation, filePath.trim());
        
        console.log('');
        console.log('🎉 Done!');
        
    } catch (error) {
        console.error('');
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Handle command line arguments
if (process.argv.length >= 4) {
    const operation = process.argv[2];
    const filePath = process.argv[3];
    
    convertFile(operation, filePath)
        .then(() => {
            console.log('🎉 Done!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error.message);
            process.exit(1);
        });
} else {
    main();
}


