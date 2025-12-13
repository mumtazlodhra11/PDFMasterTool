#!/usr/bin/env python3
"""
LibreOffice macro to set page layout for Excel files
This script modifies the Excel file's page properties before PDF conversion
"""
import sys
import os
import subprocess
import tempfile
import shutil
import time

def create_macro_file():
    """Create a LibreOffice Basic macro to set page layout"""
    macro_content = '''
Sub SetPageLayout
    Dim oDoc As Object
    Dim oSheet As Object
    Dim oPageStyle As Object
    
    oDoc = ThisComponent
    If oDoc.SupportsService("com.sun.star.sheet.SpreadsheetDocument") Then
        oSheet = oDoc.Sheets.getByIndex(0)
        oPageStyle = oDoc.StyleFamilies.getByName("PageStyles").getByName(oSheet.getPageStyle())
        
        ' Set A4 paper size
        oPageStyle.PaperFormat = com.sun.star.view.PaperFormat.A4
        oPageStyle.IsLandscape = False
        
        ' Set margins (in 100th of mm)
        oPageStyle.LeftMargin = 2000
        oPageStyle.RightMargin = 2000
        oPageStyle.TopMargin = 2000
        oPageStyle.BottomMargin = 2000
        
        ' Set scaling to fit on single page
        oPageStyle.ScaleToPagesX = 1
        oPageStyle.ScaleToPagesY = 1
    End If
End Sub
'''
    return macro_content

def convert_with_page_setup(input_path, output_path):
    """Convert Excel to PDF using soffice with proper page setup via macro"""
    try:
        # Use soffice with --macro option or use Python UNO API directly
        # Actually, let's use a simpler approach - modify the file's page properties
        # using soffice with filter options that actually work
        
        output_dir = os.path.dirname(output_path)
        output_name = os.path.splitext(os.path.basename(input_path))[0] + '.pdf'
        
        # Try using soffice with filter options in a way that LibreOffice understands
        # The key is to use the filter name with proper parameter format
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
            'pdf',  # Simple format, let LibreOffice use defaults but we'll set page properties
            '--outdir',
            output_dir,
            input_path
        ]
        
        env = os.environ.copy()
        env['SAL_USE_VCLPLUGIN'] = 'headless'
        env['HOME'] = output_dir
        
        # First, try to set page properties using Python UNO API
        # Start LibreOffice listener
        try:
            import uno
            from com.sun.star.beans import PropertyValue
            from com.sun.star.connection import NoConnectException
            
            # Try to connect to or start LibreOffice
            local_context = uno.getComponentContext()
            resolver = local_context.ServiceManager.createInstanceWithContext(
                "com.sun.star.bridge.UnoUrlResolver", local_context
            )
            
            # Check if LibreOffice is running
            try:
                context = resolver.resolve("uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
            except:
                # Start LibreOffice
                subprocess.Popen(
                    ['soffice', '--headless', '--invisible', '--accept=socket,host=localhost,port=2002;urp;'],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    env=env
                )
                import time
                time.sleep(3)
                context = resolver.resolve("uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
            
            desktop = context.ServiceManager.createInstanceWithContext(
                "com.sun.star.frame.Desktop", context
            )
            
            # Load file
            file_url = uno.systemPathToFileUrl(os.path.abspath(input_path))
            doc = desktop.loadComponentFromURL(file_url, "_blank", 0, [])
            
            if doc:
                # Set page properties
                sheets = doc.getSheets()
                for i in range(sheets.getCount()):
                    sheet = sheets.getByIndex(i)
                    page_style_name = sheet.getPageStyle()
                    page_style = doc.getStyleFamilies().getByName("PageStyles").getByName(page_style_name)
                    
                    # A4, Portrait
                    page_style.setPropertyValue("PaperFormat", 8)
                    page_style.setPropertyValue("IsLandscape", False)
                    
                    # Margins
                    page_style.setPropertyValue("LeftMargin", 2000)
                    page_style.setPropertyValue("RightMargin", 2000)
                    page_style.setPropertyValue("TopMargin", 2000)
                    page_style.setPropertyValue("BottomMargin", 2000)
                    
                    # Scaling - fit to 1 page
                    page_style.setPropertyValue("ScaleToPagesX", 1)
                    page_style.setPropertyValue("ScaleToPagesY", 1)
                
                # Export to PDF
                output_url = uno.systemPathToFileUrl(os.path.abspath(output_path))
                filter_props = (
                    PropertyValue("FilterName", 0, "calc_pdf_Export", 0),
                    PropertyValue("Overwrite", 0, True, 0),
                )
                doc.storeToURL(output_url, filter_props)
                doc.close(True)
                
                if os.path.exists(output_path):
                    return True
        except Exception as uno_error:
            print(f"UNO API failed: {uno_error}", file=sys.stderr)
            # Fall through to soffice command
        
        # Fallback: Use soffice directly
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120, env=env)
        
        if result.returncode != 0:
            print(f"soffice error: {result.stderr}", file=sys.stderr)
            return False
        
        time.sleep(2)
        expected_output = os.path.join(output_dir, output_name)
        if os.path.exists(expected_output):
            if expected_output != output_path:
                shutil.move(expected_output, output_path)
            return True
        
        return False
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 setPageLayout.py <input.xlsx> <output.pdf>", file=sys.stderr)
        sys.exit(1)
    
    if convert_with_page_setup(sys.argv[1], sys.argv[2]):
        sys.exit(0)
    else:
        sys.exit(1)

