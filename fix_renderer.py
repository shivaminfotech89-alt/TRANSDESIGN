fpath = 'src/components/reports/ReportRenderer.tsx'
with open(fpath, 'r') as f:
    content = f.read()

imports = """import { RoutineTestReport } from './templates/RoutineTestReport';
import { CoreDrawingReport } from './templates/CoreDrawingReport';
import { WindingDrawingReport } from './templates/WindingDrawingReport';
import { ProcessSheetReport } from './templates/ProcessSheetReport';"""

content = content.replace("import { RoutineTestReport } from './templates/RoutineTestReport';", imports)

cases = """    case 'routine_test': return <RoutineTestReport inputs={inputs} outputs={outputs} />;
    case 'core_drawing': return <CoreDrawingReport inputs={inputs} outputs={outputs} />;
    case 'winding_drawing': return <WindingDrawingReport inputs={inputs} outputs={outputs} />;
    case 'process_sheet': return <ProcessSheetReport inputs={inputs} outputs={outputs} />;"""

content = content.replace("    case 'routine_test': return <RoutineTestReport inputs={inputs} outputs={outputs} />;", cases)

with open(fpath, 'w') as f:
    f.write(content)
