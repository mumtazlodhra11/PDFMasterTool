#!/usr/bin/env python3
"""
Test script for PDF to Word conversion with blank page detection
Tests the improved blank page removal and page numbering logic
"""
import requests
import sys
from pathlib import Path

# Backend server URL (port 8001)
BACKEND_URL = "http://localhost:8001"

def test_pdf_to_word(file_path: str):
    """Test PDF to Word conversion and check for blank pages"""
    print(f"\n{'='*70}")
    print(f"🧪 Testing PDF to Word Conversion - Blank Page Detection")
    print(f"{'='*70}")
    print(f"📄 File: {file_path}")
    print(f"🌐 Server: {BACKEND_URL}")
    
    if not Path(file_path).exists():
        print(f"❌ Error: File not found: {file_path}")
        return False
    
    # Read file
    file_size = Path(file_path).stat().st_size
    print(f"📊 File size: {file_size / 1024:.2f} KB")
    
    print(f"\n📤 Uploading file to server...")
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (Path(file_path).name, f, 'application/pdf')}
            
            response = requests.post(
                f"{BACKEND_URL}/convert/pdf-to-word",
                files=files,
                timeout=120
            )
            
            if response.status_code == 200:
                # Parse JSON response (contains base64 encoded file)
                import json
                import base64
                result = response.json()
                
                if 'file' in result:
                    # Decode base64
                    file_data = base64.b64decode(result['file'])
                    filename = result.get('filename', 'output.docx')
                    
                    # Save DOCX
                    input_file = Path(file_path)
                    output_path = input_file.parent / filename
                    with open(output_path, 'wb') as out:
                        out.write(file_data)
                    
                    print(f"\n✅ CONVERSION SUCCESSFUL!")
                    print(f"📄 DOCX saved to: {output_path}")
                    print(f"📊 Output size: {len(file_data) / 1024:.2f} KB")
                    if 'processing_time' in result:
                        print(f"⏱️  Processing time: {result['processing_time']}")
                    
                    # Analyze the DOCX file
                    print(f"\n🔍 Analyzing converted document...")
                    analyze_docx(str(output_path))
                    
                    return True
                else:
                    print(f"\n❌ ERROR: Invalid response format")
                    print(f"Response: {result}")
                    return False
            else:
                print(f"\n❌ ERROR: Status {response.status_code}")
                try:
                    error_json = response.json()
                    print(f"Error details: {error_json.get('detail', response.text[:500])}")
                except:
                    print(f"Response: {response.text[:500]}")
                return False
                
    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: Could not connect to {BACKEND_URL}")
        print(f"💡 Make sure the backend server is running:")
        print(f"   cd google-cloud-run")
        print(f"   uvicorn app:app --host 0.0.0.0 --port 8001")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

def analyze_docx(docx_path: str):
    """Analyze DOCX file for blank pages and page numbering"""
    try:
        from docx import Document
        from docx.oxml.ns import qn
        from lxml import etree
        
        doc = Document(docx_path)
        body = doc.element.body
        
        # Get all paragraphs
        all_paras = body.xpath('.//w:p')
        
        # Count paragraphs
        total_paras = len(all_paras)
        print(f"   📝 Total paragraphs: {total_paras}")
        
        # Count paragraphs with content
        paras_with_text = 0
        paras_with_images = 0
        paras_in_tables = 0
        empty_paras = 0
        paras_with_page_breaks = 0
        
        for para_elem in all_paras:
            # Check if in table
            parent = para_elem.getparent()
            is_in_table = False
            while parent is not None:
                if parent.tag.endswith('tbl'):
                    is_in_table = True
                    paras_in_tables += 1
                    break
                parent = parent.getparent()
            
            if is_in_table:
                continue
            
            # Get text
            para_text = ''.join([t.text for t in para_elem.xpath('.//w:t') if t.text]).strip()
            
            # Check for images
            has_images = len(para_elem.xpath('.//a:blip')) > 0 or len(para_elem.xpath('.//pic:pic')) > 0
            has_drawings = len(para_elem.xpath('.//w:drawing')) > 0
            
            # Check for page breaks
            runs = para_elem.xpath('.//w:r')
            has_page_break = False
            for run in runs:
                br_nodes = run.xpath('.//w:br[@w:type="page"]')
                page_break_nodes = run.xpath('.//w:lastRenderedPageBreak')
                if br_nodes or page_break_nodes:
                    has_page_break = True
                    paras_with_page_breaks += 1
                    break
            
            if para_text:
                paras_with_text += 1
            if has_images or has_drawings:
                paras_with_images += 1
            if not para_text and not has_images and not has_drawings and not has_page_break:
                empty_paras += 1
        
        print(f"   ✅ Paragraphs with text: {paras_with_text}")
        print(f"   🖼️  Paragraphs with images: {paras_with_images}")
        print(f"   📊 Paragraphs in tables: {paras_in_tables}")
        print(f"   📄 Paragraphs with page breaks: {paras_with_page_breaks}")
        print(f"   ⚪ Empty paragraphs: {empty_paras}")
        
        # Count sections
        sections = body.xpath('.//w:sectPr')
        print(f"   📑 Total sections: {len(sections)}")
        
        # Check for TOC
        toc_fields = body.xpath('.//w:fldSimple[@w:instr="TOC"]') + body.xpath('.//w:instrText[contains(text(), "TOC")]')
        all_text = ' '.join([''.join([t.text for t in para.xpath('.//w:t') if t.text]) for para in body.xpath('.//w:p')])
        has_toc_text = 'table of contents' in all_text.lower() or 'table of content' in all_text.lower()
        
        if toc_fields or has_toc_text:
            print(f"   📚 Table of Contents: ✅ Detected")
        else:
            print(f"   📚 Table of Contents: ❌ Not detected")
        
        # Check page numbering in sections
        if len(sections) > 1:
            print(f"\n   🔢 Checking page numbering in sections...")
            for i, sect in enumerate(sections):
                try:
                    pg_num_type = sect.find(qn('w:pgNumType'))
                    if pg_num_type is not None:
                        start_attr = pg_num_type.attrib.get(qn('w:start'))
                        if start_attr:
                            print(f"      Section {i+1}: Starts at page {start_attr} ⚠️")
                        else:
                            print(f"      Section {i+1}: Continues numbering ✅")
                except:
                    pass
        
        print(f"\n✅ Analysis complete!")
        print(f"💡 Open {docx_path} in Microsoft Word to visually verify:")
        print(f"   - Blank pages removed")
        print(f"   - Page numbering correct")
        print(f"   - Content preserved")
        
    except ImportError:
        print(f"   ⚠️  python-docx not available for detailed analysis")
        print(f"   💡 Install: pip install python-docx lxml")
    except Exception as e:
        print(f"   ⚠️  Error analyzing DOCX: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Default test file
    test_file = "sample.pdf"
    
    if len(sys.argv) > 1:
        test_file = sys.argv[1]
    
    print(f"\n🚀 PDF to Word Conversion Test")
    print(f"{'='*70}")
    
    success = test_pdf_to_word(test_file)
    
    if success:
        print(f"\n{'='*70}")
        print(f"✅ TEST COMPLETED SUCCESSFULLY!")
        print(f"{'='*70}")
    else:
        print(f"\n{'='*70}")
        print(f"❌ TEST FAILED!")
        print(f"{'='*70}")
        sys.exit(1)

