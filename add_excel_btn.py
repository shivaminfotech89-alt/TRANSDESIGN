import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

buttons_old = """            <button onClick={generatePDF} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold uppercase rounded-md shadow-sm transition-colors">
              <FileText className="w-4 h-4" /> PDF Report
            </button>
          </div>"""

buttons_new = """            <button onClick={() => exportToExcel(inputs, outputs)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold uppercase rounded-md shadow-sm transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
            <button onClick={generatePDF} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold uppercase rounded-md shadow-sm transition-colors">
              <FileText className="w-4 h-4" /> PDF Report
            </button>
          </div>"""

content = content.replace(buttons_old, buttons_new)

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)
