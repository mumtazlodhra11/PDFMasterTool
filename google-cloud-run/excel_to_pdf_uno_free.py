#!/usr/bin/env python3
"""
FREE Solution: Excel to PDF with chart preservation using LibreOffice UNO API
This is a free alternative to commercial solutions
"""
import os
import sys
import subprocess
import time
import tempfile

def convert_with_uno_api(input_path: str, output_path: str, prevent_chart_split: bool = True):
    """
    Convert Excel to PDF using LibreOffice UNO API (FREE solution)
    
    This provides better control than command-line conversion
    """
    uno_process = None
    try:
        print("[UNO] Starting LibreOffice with UNO socket...")
        uno_process = subprocess.Popen([
            'soffice',
            '--headless',
            '--invisible',
            '--nologo',
            '--nodefault',
            '--accept=socket,host=localhost,port=2002;urp;'
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        time.sleep(3)  # Wait for LibreOffice to start
        
        try:
            import uno
            from com.sun.star.beans import PropertyValue
            
            # Connect to LibreOffice
            local_context = uno.getComponentContext()
            resolver = local_context.ServiceManager.createInstanceWithContext(
                "com.sun.star.bridge.UnoUrlResolver", local_context
            )
            
            context = resolver.resolve("uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
            desktop = context.ServiceManager.createInstanceWithContext(
                "com.sun.star.frame.Desktop", context
            )
            
            # Open Excel file
            file_url = uno.systemPathToFileUrl(os.path.abspath(input_path))
            doc = desktop.loadComponentFromURL(file_url, "_blank", 0, tuple())
            
            print("[UNO] ✅ Opened document")
            
            # Set print settings for each sheet
            if hasattr(doc, 'Sheets'):
                style_family = doc.StyleFamilies.getByName("PageStyles")
                for i in range(doc.Sheets.getCount()):
                    sheet = doc.Sheets.getByIndex(i)
                    page_style = sheet.PageStyle
                    style = style_family.getByName(page_style)
                    
                    if prevent_chart_split:
                        # Fit to 1 page wide
                        style.setPropertyValue("ScaleToPages", 1)
                        style.setPropertyValue("ScaleToPagesY", 0)
                        style.setPropertyValue("IsLandscape", True)
                        # Minimal margins
                        style.setPropertyValue("LeftMargin", 762)  # 0.3" in 1/100mm
                        style.setPropertyValue("RightMargin", 762)
                        style.setPropertyValue("TopMargin", 762)
                        style.setPropertyValue("BottomMargin", 762)
                        print(f"[UNO] ✅ Set print settings for sheet: {sheet.getName()}")
            
            # Export to PDF
            output_url = uno.systemPathToFileUrl(os.path.abspath(output_path))
            filter_data = (
                PropertyValue("Quality", 0, 100, 0),
                PropertyValue("IsLandscape", 0, True, 0),
            )
            
            doc.storeToURL(output_url, tuple(filter_data))
            doc.close(True)
            
            uno_process.terminate()
            uno_process.wait()
            
            print("[UNO] ✅✅✅ Conversion complete with UNO API")
            return True
            
        except ImportError:
            print("[UNO] ❌ UNO API not available")
            return False
        except Exception as e:
            print(f"[UNO] ❌ Error: {e}")
            return False
        finally:
            if uno_process:
                uno_process.terminate()
                uno_process.wait()
    
    except Exception as e:
        print(f"[UNO] ❌ Failed: {e}")
        return False

