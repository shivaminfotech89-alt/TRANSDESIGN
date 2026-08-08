import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { Download, FileText, CheckCircle2, CloudUpload } from 'lucide-react';", "import { Download, FileText, CheckCircle2, CloudUpload, FileSpreadsheet } from 'lucide-react';")

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)
