#!/usr/bin/env python3
"""
LibreOffice UNO API implementation for Excel to PDF with chart preservation
This provides better control over print settings than command-line conversion
"""
import os
import sys
import subprocess
import time
import tempfile

def convert_excel_to_pdf_with_uno_api(
    input_path: str,
    output_path: str,
    prevent_chart_split: bool = True,
    fit_to_page: bool = True,
    orientation: str = "landscape"
):
    """
    Convert Excel to PDF using LibreOffice UNO API
    
    This function:
    1. Starts LibreOffice with UNO socket
    2. Opens Excel file via UNO
    3. Sets print settings programmatically for each sheet
    4. Exports to PDF with proper settings
    """
    uno_process = None
    try:
        # Start LibreOffice in headless mode with UNO socket
        print("[UNO] Starting LibreOffice with UNO socket on port 2002...")
        uno_process = subprocess.Popen([
            'soffice',
            '--headless',
            '--invisible',
            '--nologo',
            '--nodefault',
            '--accept=socket,host=localhost,port=2002;urp;'
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Wait for LibreOffice to start
        time.sleep(3)
        
        # Try to import UNO (only available when LibreOffice Python is installed)
        try:
            import uno
            from com.sun.star.beans import PropertyValue
            from com.sun.star.connection import NoConnectException
            
            # Connect to LibreOffice
            local_context = uno.getComponentContext()
            resolver = local_context.ServiceManager.createInstanceWithContext(
                "com.sun.star.bridge.UnoUrlResolver", local_context
            )
            
            # Connect to running LibreOffice instance
            context = resolver.resolve("uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
            desktop = context.ServiceManager.createInstanceWithContext(
                "com.sun.star.frame.Desktop", context
            )
            
            print("[UNO] ✅ Connected to LibreOffice via UNO API")
            
            # Open the Excel file
            file_url = uno.systemPathToFileUrl(os.path.abspath(input_path))
            doc = desktop.loadComponentFromURL(
                file_url,
                "_blank",
                0,
                tuple()
            )
            
            print(f"[UNO] ✅ Opened document: {input_path}")
            
            # Set print settings for each sheet
            if hasattr(doc, 'Sheets'):
                sheets = doc.Sheets
                style_family = doc.StyleFamilies.getByName("PageStyles")
                
                for i in range(sheets.getCount()):
                    sheet = sheets.getByIndex(i)
                    sheet_name = sheet.getName()
                    print(f"[UNO] Processing sheet: {sheet_name}")
                    
                    # Get page style for this sheet
                    page_style_name = sheet.PageStyle
                    style = style_family.getByName(page_style_name)
                    
                    # CRITICAL: Set fit to page to prevent chart splitting
                    if fit_to_page or prevent_chart_split:
                        # ScaleToPages = 1 means fit to 1 page wide
                        # ScaleToPagesY = 0 means unlimited pages tall
                        style.setPropertyValue("ScaleToPages", 1)
                        style.setPropertyValue("ScaleToPagesY", 0)
                        print(f"[UNO] ✅ Set fit to page: ScaleToPages=1, ScaleToPagesY=0")
                    
                    # Set orientation (landscape for more horizontal space)
                    if orientation.lower() == "landscape" or prevent_chart_split:
                        style.setPropertyValue("IsLandscape", True)
                        print(f"[UNO] ✅ Set landscape orientation")
                    else:
                        style.setPropertyValue("IsLandscape", False)
                    
                    # Set minimal margins for maximum space
                    if prevent_chart_split:
                        # Margins in 1/100mm (0.3" = 7.62mm = 762 1/100mm)
                        style.setPropertyValue("LeftMargin", 762)
                        style.setPropertyValue("RightMargin", 762)
                        style.setPropertyValue("TopMargin", 762)
                        style.setPropertyValue("BottomMargin", 762)
                        style.setPropertyValue("HeaderLeftMargin", 0)
                        style.setPropertyValue("HeaderRightMargin", 0)
                        style.setPropertyValue("FooterLeftMargin", 0)
                        style.setPropertyValue("FooterRightMargin", 0)
                        print(f"[UNO] ✅ Set minimal margins (0.3\")")
                    
                    # Set page size (A4)
                    style.setPropertyValue("PaperFormat", 0)  # 0 = A4
                    print(f"[UNO] ✅ Set paper size: A4")
                    
                    # Remove page breaks (if possible via UNO)
                    # Note: Page breaks might need to be removed at sheet level
                    try:
                        # Try to access page breaks
                        if hasattr(sheet, 'getPageBreaks'):
                            # This might not be directly accessible, but we try
                            pass
                    except:
                        pass
            
            # Export to PDF with chart preservation settings
            output_url = uno.systemPathToFileUrl(os.path.abspath(output_path))
            
            # Build filter data for PDF export
            filter_data = (
                PropertyValue("Quality", 0, 100, 0),  # High quality
                PropertyValue("UseTaggedPDF", 0, False, 0),
                PropertyValue("SelectPdfVersion", 0, 1, 0),  # PDF 1.4
                PropertyValue("IsLandscape", 0, (orientation.lower() == "landscape" or prevent_chart_split), 0),
            )
            
            print(f"[UNO] Exporting to PDF: {output_path}")
            doc.storeToURL(output_url, tuple(filter_data))
            doc.close(True)
            
            print(f"[UNO] ✅✅✅ Successfully converted with UNO API")
            return True
            
        except ImportError:
            print("[UNO] ❌ UNO API not available (LibreOffice Python not installed)")
            print("[UNO] Falling back to command-line conversion")
            return False
        except Exception as e:
            print(f"[UNO] ❌ UNO API error: {e}")
            print("[UNO] Falling back to command-line conversion")
            import traceback
            traceback.print_exc()
            return False
        finally:
            # Stop LibreOffice
            if uno_process:
                uno_process.terminate()
                uno_process.wait()
                print("[UNO] Stopped LibreOffice process")
    
    except Exception as e:
        print(f"[UNO] ❌ Error: {e}")
        if uno_process:
            uno_process.terminate()
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python excel_to_pdf_uno_implementation.py <input.xlsx> <output.pdf>")
        sys.exit(1)
    
    convert_excel_to_pdf_with_uno_api(
        sys.argv[1],
        sys.argv[2],
        prevent_chart_split=True,
        fit_to_page=True,
        orientation="landscape"
    )

