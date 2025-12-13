#!/usr/bin/env python3
"""
Excel to PDF converter with proper page layout settings
Uses LibreOffice UNO API to configure page properties before PDF export

This script:
1. Opens the Excel file
2. Finds the "Sales_Data" sheet (or first sheet if not found)
3. Sets A4 Landscape paper size with proper margins
4. Detects and sets PrintArea to include all content (table + chart)
5. Sets scaling to fit content on single page (FitToPagesWide=1, FitToPagesTall=1)
6. Exports only the target sheet to PDF
"""
import sys
import os
import subprocess
import time

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
        print(f"Error starting LibreOffice listener: {e}", file=sys.stderr)
        return False

def get_used_range_with_charts(sheet):
    """Get the used range including chart positions"""
    try:
        # Get used range
        used_range = sheet.getUsedRange()
        if used_range:
            used_range_address = used_range.getRangeAddress()
            end_col = used_range_address.EndColumn
            end_row = used_range_address.EndRow
        else:
            end_col = 0
            end_row = 0
        
        # Check for charts/shapes that might extend beyond used range
        try:
            draw_page = sheet.getDrawPage()
            if draw_page and draw_page.getCount() > 0:
                # Find the rightmost and bottommost position of all shapes
                max_col = end_col
                max_row = end_row
                
                for i in range(draw_page.getCount()):
                    shape = draw_page.getByIndex(i)
                    try:
                        # Get shape position (in 100th of mm)
                        pos_x = shape.getPosition().X
                        pos_y = shape.getPosition().Y
                        size_x = shape.getSize().Width
                        size_y = shape.getSize().Height
                        
                        # Convert to cell coordinates (approximate)
                        # A4 width ~210mm = 21000, typical cell width ~2000
                        # So we estimate columns
                        cell_width = 2000  # Approximate
                        cell_height = 500  # Approximate
                        
                        shape_end_col = int((pos_x + size_x) / cell_width)
                        shape_end_row = int((pos_y + size_y) / cell_height)
                        
                        max_col = max(max_col, shape_end_col)
                        max_row = max(max_row, shape_end_row)
                    except:
                        pass  # Skip shapes we can't process
                
                end_col = max_col
                end_row = max_row
        except:
            pass  # If we can't get shapes, use used range only
        
        return (end_col, end_row)
    except Exception as e:
        print(f"Error getting used range: {e}", file=sys.stderr)
        return (10, 20)  # Default fallback

def convert_excel_to_pdf_with_layout(input_path, output_path):
    """Convert Excel to PDF with proper page layout"""
    try:
        # Ensure LibreOffice listener is running
        if not start_libreoffice_listener():
            print("Failed to start LibreOffice listener.", file=sys.stderr)
            return False

        # Import uno and connect to LibreOffice
        import uno
        from com.sun.star.beans import PropertyValue
        from com.sun.star.connection import NoConnectException
        
        local_context = uno.getComponentContext()
        resolver = local_context.ServiceManager.createInstanceWithContext(
            "com.sun.star.bridge.UnoUrlResolver", local_context
        )
        
        # Connect to LibreOffice
        try:
            context = resolver.resolve("uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
        except Exception as e:
            print(f"Failed to connect to LibreOffice: {e}", file=sys.stderr)
            return False
        
        desktop = context.ServiceManager.createInstanceWithContext(
            "com.sun.star.frame.Desktop", context
        )
        
        # Load the Excel file
        file_url = uno.systemPathToFileUrl(os.path.abspath(input_path))
        load_props = (
            PropertyValue("Hidden", 0, True, 0),
            PropertyValue("ReadOnly", 0, True, 0),
        )
        doc = desktop.loadComponentFromURL(file_url, "_blank", 0, load_props)
        
        if not doc:
            print("Failed to load Excel file.", file=sys.stderr)
            return False
        
        try:
            # Find the "Sales_Data" sheet or use first sheet
            sheets = doc.getSheets()
            target_sheet = None
            sheet_name = None
            
            # Try to find "Sales_Data" sheet
            try:
                target_sheet = sheets.getByName("Sales_Data")
                sheet_name = "Sales_Data"
            except:
                # Use first sheet if "Sales_Data" not found
                if sheets.getCount() > 0:
                    target_sheet = sheets.getByIndex(0)
                    sheet_name = target_sheet.getName()
            
            if not target_sheet:
                print("No sheets found in workbook.", file=sys.stderr)
                doc.close(True)
                return False
            
            print(f"Processing sheet: {sheet_name}", file=sys.stderr)
            
            # Get the page style for this sheet
            page_style_name = target_sheet.getPageStyle()
            page_styles = doc.getStyleFamilies().getByName("PageStyles")
            page_style = page_styles.getByName(page_style_name)
            
            # Set A4 Landscape
            # PaperFormat: 8 = A4 (com.sun.star.view.PaperFormat.A4)
            page_style.setPropertyValue("PaperFormat", 8)
            page_style.setPropertyValue("IsLandscape", True)  # Landscape orientation
            
            # Set margins (in 100th of mm) - 20mm = 2000
            page_style.setPropertyValue("LeftMargin", 2000)
            page_style.setPropertyValue("RightMargin", 2000)
            page_style.setPropertyValue("TopMargin", 2000)
            page_style.setPropertyValue("BottomMargin", 2000)
            
            # Set scaling to fit on single page
            page_style.setPropertyValue("ScaleToPagesX", 1)  # FitToPagesWide = 1
            page_style.setPropertyValue("ScaleToPagesY", 1)  # FitToPagesTall = 1
            
            # Detect and set PrintArea to include table + chart
            end_col, end_row = get_used_range_with_charts(target_sheet)
            
            # Convert to Excel address format (A1, B2, etc.)
            def col_to_letter(col):
                """Convert column number to Excel letter (0-based)"""
                result = ""
                col += 1  # Convert to 1-based
                while col > 0:
                    col -= 1
                    result = chr(65 + (col % 26)) + result
                    col //= 26
                return result
            
            start_address = "A1"
            end_address = f"{col_to_letter(end_col)}{end_row + 1}"  # +1 because rows are 1-based
            print_area = f"{start_address}:{end_address}"
            
            print(f"Setting PrintArea to: {print_area}", file=sys.stderr)
            
            # Set PrintArea
            try:
                # Clear any existing print areas first
                target_sheet.setPropertyValue("PrintAreas", ())
                # Set new print area
                target_sheet.setPropertyValue("PrintAreas", (print_area,))
            except Exception as e:
                print(f"Warning: Could not set PrintArea: {e}", file=sys.stderr)
                # Continue anyway - scaling should still work
            
            # Clear any manual page breaks
            try:
                target_sheet.setPropertyValue("ManualPageBreaks", ())
            except:
                pass
            
            # Export to PDF - only export the target sheet
            output_url = uno.systemPathToFileUrl(os.path.abspath(output_path))
            
            # PDF export filter properties
            filter_props = (
                PropertyValue("FilterName", 0, "calc_pdf_Export", 0),
                PropertyValue("Overwrite", 0, True, 0),
                PropertyValue("Selection", 0, target_sheet, 0),  # Export only this sheet
                PropertyValue("UseTaggedPDF", 0, False, 0),
                PropertyValue("SelectPdfVersion", 0, 1, 0),  # PDF 1.4
            )
            
            # Save only the target sheet
            # We need to create a temporary document with only this sheet, or use Selection
            # Actually, let's try using the Selection property in the filter
            
            doc.storeToURL(output_url, filter_props)
            
            print(f"PDF exported successfully to: {output_path}", file=sys.stderr)
            return True
            
        finally:
            doc.close(True)
            
    except Exception as e:
        print(f"Python script error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 excelToPdfWithPageSetup.py <input_excel_path> <output_pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    input_excel_path = sys.argv[1]
    output_pdf_path = sys.argv[2]
    
    if convert_excel_to_pdf_with_layout(input_excel_path, output_pdf_path):
        sys.exit(0)
    else:
        sys.exit(1)


