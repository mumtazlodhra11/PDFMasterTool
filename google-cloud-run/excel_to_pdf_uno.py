#!/usr/bin/env python3
"""
Excel to PDF converter using LibreOffice UNO API
This ensures print settings are properly applied to prevent chart splitting
"""
import sys
import os
import subprocess
import time
import tempfile

def convert_excel_to_pdf_with_uno(
    input_path: str,
    output_path: str,
    prevent_chart_split: bool = True,
    fit_to_page: bool = True,
    orientation: str = "landscape"
):
    """
    Convert Excel to PDF using LibreOffice UNO API with proper print settings
    
    This function:
    1. Starts LibreOffice with UNO socket
    2. Opens the Excel file
    3. Sets print settings programmatically
    4. Exports to PDF
    """
    try:
        # Start LibreOffice in headless mode with UNO socket
        print("[UNO] Starting LibreOffice with UNO socket...")
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
        
        # Try to connect via UNO
        try:
            import uno
            from com.sun.star.beans import PropertyValue
            from com.sun.star.connection import NoConnectException
            
            # Connect to LibreOffice
            local_context = uno.getComponentContext()
            resolver = local_context.ServiceManager.createInstanceWithContext(
                "com.sun.star.bridge.UnoUrlResolver", local_context
            )
            
            context = resolver.resolve("uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
            desktop = context.ServiceManager.createInstanceWithContext(
                "com.sun.star.frame.Desktop", context
            )
            
            # Open the Excel file
            file_url = uno.systemPathToFileUrl(os.path.abspath(input_path))
            doc = desktop.loadComponentFromURL(
                file_url,
                "_blank",
                0,
                tuple()
            )
            
            print(f"[UNO] Opened document: {input_path}")
            
            # Set print settings for each sheet
            if hasattr(doc, 'Sheets'):
                for i in range(doc.Sheets.getCount()):
                    sheet = doc.Sheets.getByIndex(i)
                    print(f"[UNO] Processing sheet: {sheet.getName()}")
                    
                    # Get page style
                    page_style = sheet.PageStyle
                    style_family = doc.StyleFamilies.getByName("PageStyles")
                    style = style_family.getByName(page_style)
                    
                    # CRITICAL: Set fit to page to prevent chart splitting
                    if fit_to_page or prevent_chart_split:
                        style.setPropertyValue("ScaleToPages", 1)  # Fit to 1 page wide
                        style.setPropertyValue("ScaleToPagesY", 0)  # Unlimited pages tall
                        print(f"[UNO] Set fit to page for sheet: {sheet.getName()}")
                    
                    # Set orientation
                    if orientation.lower() == "landscape" or prevent_chart_split:
                        style.setPropertyValue("IsLandscape", True)
                        print(f"[UNO] Set landscape orientation for sheet: {sheet.getName()}")
                    else:
                        style.setPropertyValue("IsLandscape", False)
                    
                    # Set minimal margins for maximum space
                    if prevent_chart_split:
                        style.setPropertyValue("LeftMargin", 300)  # 0.3" in 1/100mm
                        style.setPropertyValue("RightMargin", 300)
                        style.setPropertyValue("TopMargin", 300)
                        style.setPropertyValue("BottomMargin", 300)
                        print(f"[UNO] Set minimal margins for sheet: {sheet.getName()}")
            
            # Export to PDF with chart preservation settings
            output_url = uno.systemPathToFileUrl(os.path.abspath(output_path))
            
            filter_data = (
                PropertyValue("Quality", 0, 100, 0),  # High quality
                PropertyValue("UseTaggedPDF", 0, False, 0),
                PropertyValue("SelectPdfVersion", 0, 1, 0),  # PDF 1.4
                PropertyValue("IsLandscape", 0, prevent_chart_split, 0),  # Force landscape
            )
            
            doc.storeToURL(output_url, tuple(filter_data))
            doc.close(True)
            
            # Stop LibreOffice
            uno_process.terminate()
            uno_process.wait()
            
            print(f"[UNO] ✅ Successfully converted with UNO API: {output_path}")
            return True
            
        except ImportError:
            print("[UNO] UNO API not available, falling back to command-line conversion")
            uno_process.terminate()
            return False
        except Exception as e:
            print(f"[UNO] UNO API failed: {e}, falling back to command-line conversion")
            uno_process.terminate()
            return False
            
    except Exception as e:
        print(f"[UNO] Error in UNO conversion: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python excel_to_pdf_uno.py <input.xlsx> <output.pdf>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    convert_excel_to_pdf_with_uno(
        input_path,
        output_path,
        prevent_chart_split=True,
        fit_to_page=True,
        orientation="landscape"
    )

