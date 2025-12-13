#!/usr/bin/env python3
"""
Excel to PDF converter with proper page layout settings
Uses LibreOffice UNO API to configure page properties before PDF export

This script:
1. Opens the Excel file
2. Sets A4 paper size with proper margins
3. Configures print area to include all content (table + chart)
4. Sets scaling to fit content on single page (FitToPagesWide=1, FitToPagesTall=1)
5. Exports to PDF
"""
import sys
import os
import subprocess
import time
import signal

def start_libreoffice_listener():
    """Start LibreOffice in listener mode for UNO API"""
    try:
        # Check if LibreOffice is already running
        result = subprocess.run(
            ['pgrep', '-f', 'soffice.*accept'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return True  # Already running
        
        # Start LibreOffice in listener mode
        subprocess.Popen(
            [
                'soffice',
                '--headless',
                '--invisible',
                '--nodefault',
                '--norestore',
                '--nofirststartwizard',
                '--nolockcheck',
                '--nologo',
                '--accept=socket,host=localhost,port=2002;urp;StarOffice.ComponentContext'
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env={**os.environ, 'SAL_USE_VCLPLUGIN': 'headless', 'HOME': '/tmp'}
        )
        
        # Wait for LibreOffice to start
        time.sleep(3)
        return True
    except Exception as e:
        print(f"Failed to start LibreOffice listener: {e}", file=sys.stderr)
        return False

def convert_excel_to_pdf_with_layout(input_path, output_path):
    """Convert Excel to PDF with proper page layout using UNO API"""
    try:
        # Start LibreOffice listener
        if not start_libreoffice_listener():
            return False
        
        # Import UNO
        try:
            import uno
            from com.sun.star.beans import PropertyValue
            from com.sun.star.connection import NoConnectException
        except ImportError:
            print("UNO API not available, falling back to simple conversion", file=sys.stderr)
            return False
        
        # Connect to LibreOffice
        local_context = uno.getComponentContext()
        resolver = local_context.ServiceManager.createInstanceWithContext(
            "com.sun.star.bridge.UnoUrlResolver", local_context
        )
        
        try:
            context = resolver.resolve("uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
        except NoConnectException:
            print("Could not connect to LibreOffice. Make sure it's running.", file=sys.stderr)
            return False
        
        desktop = context.ServiceManager.createInstanceWithContext(
            "com.sun.star.frame.Desktop", context
        )
        
        # Load the Excel file
        file_url = uno.systemPathToFileUrl(os.path.abspath(input_path))
        doc = desktop.loadComponentFromURL(
            file_url, "_blank", 0, []
        )
        
        if not doc:
            print("Failed to load Excel file", file=sys.stderr)
            return False
        
        # Get the spreadsheet
        sheets = doc.getSheets()
        if sheets.getCount() == 0:
            doc.close(True)
            return False
        
        # Configure page layout for each sheet
        for sheet_index in range(sheets.getCount()):
            sheet = sheets.getByIndex(sheet_index)
            
            # Get page style
            page_style_name = sheet.getPageStyle()
            page_style = doc.getStyleFamilies().getByName("PageStyles").getByName(page_style_name)
            
            # Set paper size to A4 (8 = A4 in LibreOffice)
            page_style.setPropertyValue("PaperFormat", 8)  # A4
            page_style.setPropertyValue("IsLandscape", False)  # Portrait
            
            # Set margins (in 100th of mm, 1000 = 10mm = ~0.39 inches)
            # Normal margins: 2.5cm = 2500
            page_style.setPropertyValue("LeftMargin", 2000)  # 20mm left
            page_style.setPropertyValue("RightMargin", 2000)  # 20mm right
            page_style.setPropertyValue("TopMargin", 2000)  # 20mm top
            page_style.setPropertyValue("BottomMargin", 2000)  # 20mm bottom
            
            # Set scaling to fit content on single page
            # ScaleToPagesX = 1 means fit to 1 page wide
            # ScaleToPagesY = 1 means fit to 1 page tall
            page_style.setPropertyValue("ScaleToPagesX", 1)
            page_style.setPropertyValue("ScaleToPagesY", 1)
            
            # Ensure all pages are printed
            page_style.setPropertyValue("FirstPageNumber", 1)
            
            # Get used range to set print area
            try:
                used_range = sheet.getUsedRange()
                if used_range:
                    # Set print area to used range (includes table and chart area)
                    # Format: "Sheet1.A1:Q22" or similar
                    range_address = used_range.getRangeAddress()
                    sheet_name = sheet.getName()
                    print_area = f"{sheet_name}.{range_address.StartColumn}:{range_address.EndColumn}{range_address.StartRow + 1}:{range_address.EndRow + 1}"
                    
                    # Try to set print area (may not work for all LibreOffice versions)
                    try:
                        sheet.setPropertyValue("PrintArea", print_area)
                    except:
                        pass  # Print area setting may not be available
            except:
                pass  # If we can't get used range, continue without setting print area
        
        # Export to PDF
        output_url = uno.systemPathToFileUrl(os.path.abspath(output_path))
        
        filter_props = (
            PropertyValue("FilterName", 0, "calc_pdf_Export", 0),
            PropertyValue("Overwrite", 0, True, 0),
            PropertyValue("SelectPdfVersion", 0, 1, 0),  # PDF 1.4
            PropertyValue("Quality", 0, 100, 0),
            PropertyValue("ReduceImageResolution", 0, False, 0),
            PropertyValue("MaxImageResolution", 0, 300, 0),
            PropertyValue("UseTaggedPDF", 0, False, 0),
            PropertyValue("ExportFormFields", 0, True, 0),
            PropertyValue("ExportBookmarks", 0, True, 0),
            PropertyValue("IsSkipEmptyPages", 0, False, 0),
        )
        
        doc.storeToURL(output_url, filter_props)
        doc.close(True)
        
        # Wait for file to be written
        time.sleep(1)
        
        return os.path.exists(output_path)
        
    except Exception as e:
        print(f"UNO API conversion error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False

def convert_with_soffice_fallback(input_path, output_path):
    """Fallback: Use soffice command-line with SinglePageSheets option"""
    try:
        output_dir = os.path.dirname(output_path)
        output_name = os.path.splitext(os.path.basename(input_path))[0] + '.pdf'
        
        # Use SinglePageSheets=true to fit each sheet on one page
        # This prevents charts from being split
        cmd = [
            'soffice',
            '--headless',
            '--invisible',
            '--nodefault',
            '--norestore',
            '--nofirststartwizard',
            '--nolockcheck',
            '--nologo',
            '--convert-to',
            'pdf:calc_pdf_Export:{"SinglePageSheets":true,"ScaleToPagesX":1,"ScaleToPagesY":1}',
            '--outdir',
            output_dir,
            input_path
        ]
        
        env = os.environ.copy()
        env['SAL_USE_VCLPLUGIN'] = 'headless'
        env['HOME'] = output_dir
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
            env=env
        )
        
        if result.returncode != 0:
            print(f"soffice error: {result.stderr}", file=sys.stderr)
            return False
        
        time.sleep(2)
        
        expected_output = os.path.join(output_dir, output_name)
        if os.path.exists(expected_output):
            if expected_output != output_path:
                os.rename(expected_output, output_path)
            return True
        
        return False
        
    except Exception as e:
        print(f"soffice fallback error: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 excelToPdfWithLayout.py <input.xlsx> <output.pdf>", file=sys.stderr)
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    # Try UNO API first (better control over page layout)
    if convert_excel_to_pdf_with_layout(input_path, output_path):
        sys.exit(0)
    
    # Fallback to soffice command-line
    print("UNO API failed, trying soffice fallback...", file=sys.stderr)
    if convert_with_soffice_fallback(input_path, output_path):
        sys.exit(0)
    
    print("All conversion methods failed", file=sys.stderr)
    sys.exit(1)

