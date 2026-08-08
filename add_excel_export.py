import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

# Add import
import_line = "import { exportToExcel } from '../lib/exportUtils';"
if import_line not in content:
    content = content.replace("import { WindingDesignTab } from './WindingDesignTab';", "import { WindingDesignTab } from './WindingDesignTab';\n" + import_line)

# Add icon import 
content = content.replace("import { Download, FileText, CheckCircle2, CloudUpload } from 'lucide-react';", "import { Download, FileText, CheckCircle2, CloudUpload, FileSpreadsheet } from 'lucide-react';")

# Find where print button is and add excel button next to it
# The print button seems to be somewhere. Let's look for `generatePDF`.
# Let's check where the buttons are:
