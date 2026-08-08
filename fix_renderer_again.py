fpath = 'src/components/reports/ReportRenderer.tsx'
with open(fpath, 'r') as f:
    content = f.read()

imports = """import { RoutineTestReport } from './templates/RoutineTestReport';
import { CoreDrawingReport } from './templates/CoreDrawingReport';
import { WindingDrawingReport } from './templates/WindingDrawingReport';
import { ProcessSheetReport } from './templates/ProcessSheetReport';
import { GaDrawingReport } from './templates/GaDrawingReport';
import { InternalAssemblyReport } from './templates/InternalAssemblyReport';
import { InsulationScheduleReport } from './templates/InsulationScheduleReport';
import { TankDrawingReport } from './templates/TankDrawingReport';
import { RadiatorDrawingReport } from './templates/RadiatorDrawingReport';
import { AccessoriesReport } from './templates/AccessoriesReport';"""

content = content.replace("""import { RoutineTestReport } from './templates/RoutineTestReport';
import { CoreDrawingReport } from './templates/CoreDrawingReport';
import { WindingDrawingReport } from './templates/WindingDrawingReport';
import { ProcessSheetReport } from './templates/ProcessSheetReport';""", imports)

cases = """    case 'routine_test': return <RoutineTestReport inputs={inputs} outputs={outputs} />;
    case 'core_drawing': return <CoreDrawingReport inputs={inputs} outputs={outputs} />;
    case 'winding_drawing': return <WindingDrawingReport inputs={inputs} outputs={outputs} />;
    case 'process_sheet': return <ProcessSheetReport inputs={inputs} outputs={outputs} />;
    case 'ga_drawing': return <GaDrawingReport inputs={inputs} outputs={outputs} />;
    case 'internal_assembly': return <InternalAssemblyReport inputs={inputs} outputs={outputs} />;
    case 'insulation_schedule': return <InsulationScheduleReport inputs={inputs} outputs={outputs} />;
    case 'tank_drawing': return <TankDrawingReport inputs={inputs} outputs={outputs} />;
    case 'radiator_drawing': return <RadiatorDrawingReport inputs={inputs} outputs={outputs} />;
    case 'accessories': return <AccessoriesReport inputs={inputs} outputs={outputs} />;"""

content = content.replace("""    case 'routine_test': return <RoutineTestReport inputs={inputs} outputs={outputs} />;
    case 'core_drawing': return <CoreDrawingReport inputs={inputs} outputs={outputs} />;
    case 'winding_drawing': return <WindingDrawingReport inputs={inputs} outputs={outputs} />;
    case 'process_sheet': return <ProcessSheetReport inputs={inputs} outputs={outputs} />;""", cases)

with open(fpath, 'w') as f:
    f.write(content)

