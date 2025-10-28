#!/usr/bin/env python3
"""
PDFMasterTool - Lambda Functions Test Client (Python)
Simple CLI tool to test Lambda conversion functions
"""

import sys
import os
import base64
import json
import time
from pathlib import Path
try:
    import requests
except ImportError:
    print("❌ Please install requests: pip install requests")
    sys.exit(1)

# Lambda Function URLs
LAMBDA_URLS = {
    'word-to-pdf': 'https://euptkdl3fgsgyoud66lkiti54q0nnwbx.lambda-url.eu-west-1.on.aws/',
    'ppt-to-pdf': 'https://kjvlahhbpn5vgcz65eyp4as22m0qeytt.lambda-url.eu-west-1.on.aws/',
    'pdf-to-word': 'https://xxr3sbwwhdjfanfdbaqwvsg2ea0bvzzk.lambda-url.eu-west-1.on.aws/',
    'pdf-to-excel': 'https://odxspqynwszdskoxt7ml2urbjq0qddvh.lambda-url.eu-west-1.on.aws/',
    'pdf-to-ppt': 'https://mxw5nxnwmsic4yflfnevu4aapa0dxqbq.lambda-url.eu-west-1.on.aws/',
}

OUTPUT_EXTENSIONS = {
    'word-to-pdf': 'pdf',
    'ppt-to-pdf': 'pdf',
    'pdf-to-word': 'docx',
    'pdf-to-excel': 'xlsx',
    'pdf-to-ppt': 'pptx',
}

def convert_file(operation, input_file_path):
    """Convert file using Lambda function"""
    
    print(f"\n🚀 Starting conversion: {operation}")
    print(f"📁 Input file: {input_file_path}")
    
    # Check if file exists
    if not os.path.exists(input_file_path):
        raise FileNotFoundError(f"File not found: {input_file_path}")
    
    # Read file and convert to base64
    with open(input_file_path, 'rb') as f:
        file_content = f.read()
    
    base64_content = base64.b64encode(file_content).decode('utf-8')
    file_name = os.path.basename(input_file_path)
    file_size_kb = len(file_content) / 1024
    
    print(f"📦 File size: {file_size_kb:.2f} KB")
    print(f"🔄 Sending to Lambda...")
    
    # Get Lambda URL
    lambda_url = LAMBDA_URLS.get(operation)
    if not lambda_url:
        raise ValueError(f"Unknown operation: {operation}")
    
    # Prepare request payload
    payload = {
        'fileContent': base64_content,
        'fileName': file_name
    }
    
    # Send request
    start_time = time.time()
    
    try:
        response = requests.post(
            lambda_url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=300  # 5 minutes timeout
        )
        
        duration = time.time() - start_time
        print(f"⏱️  Request took: {duration:.2f}s")
        
        response.raise_for_status()
        result = response.json()
        
        if result.get('success') == False or result.get('error'):
            raise Exception(result.get('error', 'Conversion failed'))
        
        # Check if we have converted file data
        if 'fileContent' in result or 'data' in result:
            output_base64 = result.get('fileContent') or result.get('data')
            output_extension = OUTPUT_EXTENSIONS.get(operation, 'bin')
            output_file_name = result.get('fileName') or f'converted_{int(time.time())}.{output_extension}'
            output_path = os.path.join(os.getcwd(), output_file_name)
            
            # Write output file
            output_buffer = base64.b64decode(output_base64)
            with open(output_path, 'wb') as f:
                f.write(output_buffer)
            
            output_size_kb = len(output_buffer) / 1024
            
            print(f"✅ Conversion successful!")
            print(f"💾 Output saved: {output_path}")
            print(f"📦 Output size: {output_size_kb:.2f} KB")
            
            return {
                'success': True,
                'output_path': output_path,
                'duration': duration
            }
        else:
            print(f"✅ Response received:")
            print(json.dumps(result, indent=2))
            
            return {
                'success': True,
                'result': result,
                'duration': duration
            }
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {str(e)}")
        raise
    except Exception as e:
        print(f"❌ Conversion failed: {str(e)}")
        raise

def main():
    """Main interactive function"""
    
    print('╔════════════════════════════════════════╗')
    print('║  PDFMasterTool - Lambda Test Client   ║')
    print('╚════════════════════════════════════════╝')
    print('')
    
    # Show available operations
    print('Available operations:')
    print('  1. Word to PDF')
    print('  2. PPT to PDF')
    print('  3. PDF to Word')
    print('  4. PDF to Excel')
    print('  5. PDF to PowerPoint')
    print('')
    
    try:
        # Get operation choice
        choice = input('Select operation (1-5): ').strip()
        
        operations = {
            '1': 'word-to-pdf',
            '2': 'ppt-to-pdf',
            '3': 'pdf-to-word',
            '4': 'pdf-to-excel',
            '5': 'pdf-to-ppt'
        }
        
        operation = operations.get(choice)
        if not operation:
            print('❌ Invalid choice!')
            return
        
        # Get file path
        file_path = input('Enter file path: ').strip().strip('"\'')
        
        # Perform conversion
        convert_file(operation, file_path)
        
        print('')
        print('🎉 Done!')
        
    except KeyboardInterrupt:
        print('\n\n⚠️  Cancelled by user')
        sys.exit(0)
    except Exception as e:
        print('')
        print(f'❌ Error: {str(e)}')
        sys.exit(1)

if __name__ == '__main__':
    # Handle command line arguments
    if len(sys.argv) >= 3:
        operation = sys.argv[1]
        file_path = sys.argv[2]
        
        try:
            convert_file(operation, file_path)
            print('🎉 Done!')
        except Exception as e:
            print(f'❌ Error: {str(e)}')
            sys.exit(1)
    else:
        main()


