import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

import_statement = "import { WindingDesignTab } from './WindingDesignTab';\n"
if "WindingDesignTab" not in content:
    content = content.replace("import { CorePartsDesignTab }", import_statement + "import { CorePartsDesignTab }")

start_marker = "<div className={`${activeTab === 'winding' ? 'block' : 'hidden'} print:block space-y-6`}>"
end_marker = "{/* CORE TAB */}"

idx1 = content.find(start_marker)
idx2 = content.find(end_marker)

if idx1 != -1 and idx2 != -1:
    new_content = content[:idx1 + len(start_marker)] + "\n            <WindingDesignTab inputs={inputs} outputs={outputs} />\n          </div>\n\n          " + content[idx2:]
    with open('src/components/ResultsDisplay.tsx', 'w') as f:
        f.write(new_content)
else:
    print(f"Could not find markers {idx1} {idx2}")
