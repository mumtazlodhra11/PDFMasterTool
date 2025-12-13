#!/usr/bin/env python3
"""
Local test script for Excel to PDF conversion with charts
Run this to test locally before deploying
"""
import requests
import json
import sys
from pathlib import Path

# Local server URL
LOCAL_URL = "http://localhost:9001"

def test_excel_to_pdf(file_path: str):
    """Test Excel to PDF conversion locally"""
    print(f"\n{'='*60}")
    print(f"Testing Excel to PDF conversion")
    print(f"{'='*60}")
    print(f"File: {file_path}")
    print(f"Server: {LOCAL_URL}")
    
    if not Path(file_path).exists():
        print(f"❌ Error: File not found: {file_path}")
        return False
    
    # Read file
    with open(file_path, 'rb') as f:
        files = {'file': (Path(file_path).name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        
        # Test with chart split prevention enabled
        data = {
            'prevent_chart_split': 'true',
            'scale_charts_to_fit': 'true',
            'fit_to_page': 'true',
            'print_quality': 'high',
            'orientation': 'landscape',  # Force landscape for charts
        }
        
        print(f"\n📤 Uploading file...")
        print(f"Options: {json.dumps(data, indent=2)}")
        
        try:
            response = requests.post(
                f"{LOCAL_URL}/convert/excel-to-pdf",
                files=files,
                data=data,
                timeout=120
            )
            
            if response.status_code == 200:
                # Save PDF
                output_path = Path(file_path).stem + "_converted.pdf"
                with open(output_path, 'wb') as out:
                    out.write(response.content)
                
                print(f"\n✅ SUCCESS!")
                print(f"📄 PDF saved to: {output_path}")
                print(f"📊 Size: {len(response.content) / 1024:.2f} KB")
                return True
            else:
                print(f"\n❌ ERROR: Status {response.status_code}")
                print(f"Response: {response.text[:500]}")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"\n❌ ERROR: Could not connect to {LOCAL_URL}")
            print(f"Make sure the server is running:")
            print(f"  cd google-cloud-run")
            print(f"  python app.py")
            return False
        except Exception as e:
            print(f"\n❌ ERROR: {e}")
            return False

if __name__ == "__main__":
    # Default test file
    test_file = "sample.xlsx"
    
    if len(sys.argv) > 1:
        test_file = sys.argv[1]
    
    print(f"\n🚀 Local Excel to PDF Test")
    print(f"{'='*60}")
    
    success = test_excel_to_pdf(test_file)
    
    if success:
        print(f"\n✅ Test completed successfully!")
        print(f"📄 Check the generated PDF to verify chart rendering")
    else:
        print(f"\n❌ Test failed!")
        sys.exit(1)

