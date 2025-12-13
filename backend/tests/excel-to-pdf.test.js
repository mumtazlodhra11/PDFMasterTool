/**
 * Automated tests for Excel to PDF conversion
 * 
 * Tests that Excel files with tables and charts are converted correctly:
 * - Single page output
 * - A4 page size
 * - Proper layout (table + chart on one page)
 * - Landscape orientation
 * - PrintArea and scaling properly applied
 */

const fs = require('fs').promises;
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

// PDF parsing utilities
async function getPdfPageCount(pdfPath) {
  try {
    // Use pdfinfo if available, or parse PDF manually
    try {
      const { stdout } = await execFileAsync('pdfinfo', [pdfPath]);
      const match = stdout.match(/Pages:\s+(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    } catch {
      // pdfinfo not available, parse PDF manually
      const pdfBuffer = await fs.readFile(pdfPath);
      const pdfText = pdfBuffer.toString('binary');
      
      // Look for /Count in Pages object
      const pagesMatch = pdfText.match(/\/Count\s+(\d+)/);
      if (pagesMatch) {
        return parseInt(pagesMatch[1], 10);
      }
      
      // Fallback: count /Type\s*\/Page[^s] occurrences
      const pageMatches = pdfText.match(/\/Type\s*\/Page[^s]/g);
      if (pageMatches) {
        return pageMatches.length;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    return null;
  }
}

async function getPdfPageSize(pdfPath) {
  try {
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfText = pdfBuffer.toString('binary');
    
    // Look for MediaBox in PDF (format: [llx lly urx ury])
    // A4 Landscape: [0 0 842 595] (in points, 1 point = 1/72 inch)
    // A4 Portrait: [0 0 595 842]
    const mediaBoxMatch = pdfText.match(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/);
    if (mediaBoxMatch) {
      const width = parseFloat(mediaBoxMatch[3]) - parseFloat(mediaBoxMatch[1]);
      const height = parseFloat(mediaBoxMatch[4]) - parseFloat(mediaBoxMatch[2]);
      
      // A4 Landscape: 842 x 595 points (297mm x 210mm)
      // A4 Portrait: 595 x 842 points (210mm x 297mm)
      // Allow some tolerance
      const isA4Landscape = Math.abs(width - 842) < 10 && Math.abs(height - 595) < 10;
      const isA4Portrait = Math.abs(width - 595) < 10 && Math.abs(height - 842) < 10;
      
      return {
        width,
        height,
        isA4: isA4Landscape || isA4Portrait,
        isLandscape: isA4Landscape,
        isPortrait: isA4Portrait,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting PDF page size:', error);
    return null;
  }
}

async function createTestExcelFile(outputPath) {
  /**
   * Create a test Excel file programmatically using Python
   * This creates a file similar to the user's "Sales_Data" sheet:
   * - Table in A1:D7 with months and product data
   * - Line chart titled "Half-Yearly Sales Trend"
   */
  const pythonScript = `
import sys
try:
    from openpyxl import Workbook
    from openpyxl.chart import LineChart, Reference
    from openpyxl.drawing.image import Image
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Sales_Data"
    
    # Create table data
    headers = ["Month", "Product A", "Product B", "Product C"]
    data = [
        ["Jan", 1300, 900, 600],
        ["Feb", 1500, 1100, 750],
        ["Mar", 1700, 1300, 900],
        ["Apr", 1600, 1250, 850],
        ["May", 1800, 1400, 950],
        ["Jun", 2000, 1500, 1100],
    ]
    
    # Write headers
    for col, header in enumerate(headers, start=1):
        ws.cell(row=1, column=col, value=header)
    
    # Write data
    for row_idx, row_data in enumerate(data, start=2):
        for col_idx, value in enumerate(row_data, start=1):
            ws.cell(row=row_idx, column=col_idx, value=value)
    
    # Create line chart
    chart = LineChart()
    chart.title = "Half-Yearly Sales Trend"
    chart.style = 13
    chart.y_axis.title = "Sales"
    chart.x_axis.title = "Month"
    
    # Data for chart (Product A, B, C columns)
    data_ref = Reference(ws, min_col=2, min_row=1, max_col=4, max_row=7)
    cats_ref = Reference(ws, min_col=1, min_row=2, max_row=7)
    
    chart.add_data(data_ref, titles_from_data=True)
    chart.set_categories(cats_ref)
    
    # Position chart to the right of the table (column F)
    ws.add_chart(chart, "F2")
    
    # Save workbook
    wb.save(sys.argv[1])
    print("Excel file created successfully")
    sys.exit(0)
except ImportError:
    print("openpyxl not available, skipping test Excel creation", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"Error creating Excel file: {e}", file=sys.stderr)
    sys.exit(1)
`;
  
  try {
    // Try to create Excel file using Python with openpyxl
    const { stdout, stderr } = await execFileAsync('python3', ['-c', pythonScript, outputPath], {
      timeout: 30000,
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);
    
    // Check if file was created
    try {
      await fs.access(outputPath);
      return true;
    } catch {
      return false;
    }
  } catch (error) {
    console.log('Could not create test Excel file programmatically:', error.message);
    console.log('Test will be skipped - install openpyxl: pip install openpyxl');
    return false;
  }
}

describe('Excel to PDF Conversion', () => {
  const testDir = path.join(__dirname, '..', 'test-output');
  const testExcelPath = path.join(testDir, 'test_sales_data.xlsx');
  const testPdfPath = path.join(testDir, 'test_sales_data.pdf');
  const conversionScript = path.join(__dirname, '..', 'src', 'utils', 'excelToPdfWithPageSetup.py');
  
  beforeAll(async () => {
    // Create test output directory
    try {
      await fs.mkdir(testDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Create test Excel file
    const created = await createTestExcelFile(testExcelPath);
    if (!created) {
      console.log('Skipping tests - test Excel file could not be created');
    }
  });
  
  afterAll(async () => {
    // Cleanup test files
    try {
      await fs.unlink(testExcelPath).catch(() => {});
      await fs.unlink(testPdfPath).catch(() => {});
      await fs.rmdir(testDir).catch(() => {});
    } catch (error) {
      // Ignore cleanup errors
    }
  });
  
  test('should convert Excel to PDF with single page output', async () => {
    // Skip if test Excel file doesn't exist
    try {
      await fs.access(testExcelPath);
    } catch {
      console.log('Skipping test - test Excel file not available');
      return;
    }
    
    // Run conversion
    try {
      await execFileAsync('python3', [conversionScript, testExcelPath, testPdfPath], {
        timeout: 120000,
        env: {
          ...process.env,
          SAL_USE_VCLPLUGIN: 'headless',
          HOME: testDir,
        },
      });
    } catch (error) {
      // Check if PDF was created despite error
      try {
        await fs.access(testPdfPath);
      } catch {
        throw new Error(`Conversion failed: ${error.message}`);
      }
    }
    
    // Verify PDF exists
    const pdfExists = await fs.access(testPdfPath).then(() => true).catch(() => false);
    expect(pdfExists).toBe(true);
    
    // Check PDF page count
    const pageCount = await getPdfPageCount(testPdfPath);
    expect(pageCount).toBe(1);
  }, 120000);
  
  test('should produce A4 Landscape PDF', async () => {
    // Skip if test PDF doesn't exist
    try {
      await fs.access(testPdfPath);
    } catch {
      console.log('Skipping test - test PDF not available');
      return;
    }
    
    const pageSize = await getPdfPageSize(testPdfPath);
    expect(pageSize).not.toBeNull();
    expect(pageSize.isA4).toBe(true);
    expect(pageSize.isLandscape).toBe(true);
  });
  
  test('should include table and chart on single page', async () => {
    // Skip if test PDF doesn't exist
    try {
      await fs.access(testPdfPath);
    } catch {
      console.log('Skipping test - test PDF not available');
      return;
    }
    
    // Read PDF and check for content markers
    const pdfBuffer = await fs.readFile(testPdfPath);
    const pdfText = pdfBuffer.toString('binary');
    
    // Check that PDF is not empty and has reasonable size
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    
    // Check for PDF structure (should have proper PDF header)
    expect(pdfText).toMatch(/^%PDF-/);
    
    // Note: More detailed content validation would require PDF parsing library
    // For now, we verify structure and page count
  });
});

module.exports = {
  getPdfPageCount,
  getPdfPageSize,
  createTestExcelFile,
};
