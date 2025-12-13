#!/usr/bin/env python3
"""
Excel to PDF converter with aggressive chart split prevention
Uses LibreOffice UNO API to set print settings programmatically
"""
import sys
import os
import subprocess
import tempfile

def convert_excel_to_pdf_with_chart_fix(
    input_path: str,
    output_path: str,
    prevent_chart_split: bool = True,
    fit_to_page: bool = True,
    orientation: str = "portrait",
    page_size: str = "A4"
):
    """
    Convert Excel to PDF using LibreOffice with chart split prevention
    
    This function uses LibreOffice's Python UNO API to:
    1. Open the Excel file
    2. Set print settings to prevent chart splitting
    3. Export to PDF with proper settings
    """
    try:
        # Try to use LibreOffice Python UNO API
        try:
            import uno
            from com.sun.star.beans import PropertyValue
            from com.sun.star.connection import NoConnectException
            from com.sun.star.uno import Exception as UnoException
            
            # Connect to LibreOffice
            local_context = uno.getComponentContext()
            resolver = local_context.ServiceManager.createInstanceWithContext(
                "com.sun.star.bridge.UnoUrlResolver", local_context
            )
            
            # Try to connect to running LibreOffice instance
            try:
                context = resolver.resolve("uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
            except:
                # Start LibreOffice in headless mode with UNO socket
                print("[Excel->PDF] Starting LibreOffice with UNO socket...")
                subprocess.Popen([
                    'soffice',
                    '--headless',
                    '--invisible',
                    '--nologo',
                    '--nodefault',
                    '--accept=socket,host=localhost,port=2002;urp;'
                ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                import time
                time.sleep(3)  # Wait for LibreOffice to start
                
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
            
            # Set print settings for each sheet
            if hasattr(doc, 'Sheets'):
                for i in range(doc.Sheets.getCount()):
                    sheet = doc.Sheets.getByIndex(i)
                    
                    # Get page style
                    page_style = sheet.PageStyle
                    style_family = doc.StyleFamilies.getByName("PageStyles")
                    style = style_family.getByName(page_style)
                    
                    # CRITICAL: Set fit to page to prevent chart splitting
                    if fit_to_page or prevent_chart_split:
                        style.setPropertyValue("ScaleToPages", 1)  # Fit to 1 page wide
                        style.setPropertyValue("ScaleToPagesY", 0)  # Unlimited pages tall
                        print(f"[Excel->PDF] Set fit to page for sheet: {sheet.getName()}")
                    
                    # Set orientation
                    if orientation.lower() == "landscape":
                        style.setPropertyValue("IsLandscape", True)
                    else:
                        style.setPropertyValue("IsLandscape", False)
                    
                    # Set page size
                    size_map = {
                        "A4": 0,  # A4
                        "Letter": 1,  # Letter
                        "Legal": 5,  # Legal
                        "A3": 8,  # A3
                        "Tabloid": 3,  # Tabloid
                    }
                    if page_size in size_map:
                        style.setPropertyValue("PaperFormat", size_map[page_size])
            
            # Export to PDF with chart preservation settings
            output_url = uno.systemPathToFileUrl(os.path.abspath(output_path))
            
            filter_data = (
                PropertyValue("Quality", 0, 100, 0),  # High quality
                PropertyValue("UseTaggedPDF", 0, False, 0),
                PropertyValue("SelectPdfVersion", 0, 1, 0),  # PDF 1.4
            )
            
            doc.storeToURL(output_url, tuple(filter_data))
            doc.close(True)
            
            print(f"[Excel->PDF] ✅ Successfully converted with UNO API")
            return True
            
        except ImportError:
            print("[Excel->PDF] UNO API not available, using fallback method...")
            return False
        except Exception as e:
            print(f"[Excel->PDF] UNO API failed: {e}, using fallback method...")
            return False
            
    except Exception as e:
        print(f"[Excel->PDF] Error in chart fix conversion: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python excel_to_pdf_with_chart_fix.py <input.xlsx> <output.pdf>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    convert_excel_to_pdf_with_chart_fix(
        input_path,
        output_path,
        prevent_chart_split=True,
        fit_to_page=True
    )

