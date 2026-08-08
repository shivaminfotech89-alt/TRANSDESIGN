import React, { useState } from 'react';
import { TransformerOutputs, TransformerInputs } from '../../types';
import { FileText, Printer, FileDown, Settings, Layers, Box, FileCheck, Truck, ShieldCheck, PenTool } from 'lucide-react';
import { ReportRenderer } from './ReportRenderer';

const REPORT_CATEGORIES = [
  {
    id: 'engineering',
    name: 'Design & Engineering',
    icon: <PenTool className="w-4 h-4" />,
    reports: [
      { id: 'input_sheet', name: '01. Design Input Sheet' },
      { id: 'calc_report', name: '02. Complete Engineering Calculation' },
      { id: 'summary', name: '03. Executive Design Summary' }
    ]
  },
  {
    id: 'drawings',
    name: 'Manufacturing Drawings',
    icon: <Layers className="w-4 h-4" />,
    reports: [
      { id: 'ga_drawing', name: '04. General Arrangement (GA)' },
      { id: 'internal_assembly', name: '05. Internal Assembly' },
      { id: 'core_drawing', name: '06. Core Manufacturing Drawing' },
      { id: 'winding_drawing', name: '07. Winding Manufacturing Drawing' },
      { id: 'insulation_schedule', name: '08. Insulation Schedule' },
      { id: 'tank_drawing', name: '09. Tank Fabrication Drawing' },
      { id: 'radiator_drawing', name: '10. Radiator Drawing' },
      { id: 'accessories', name: '11. Accessories Layout' }
    ]
  },
  {
    id: 'planning',
    name: 'Planning & Costing',
    icon: <Settings className="w-4 h-4" />,
    reports: [
      { id: 'complete_bom', name: '12. Complete Bill of Materials (BOM)' },
      { id: 'mrp', name: '13. Material Requirement Planning (MRP)' },
      { id: 'process_sheet', name: '14. Manufacturing Process Sheet' },
      { id: 'routing_sheet', name: '15. Production Routing Sheet' },
      { id: 'cost_estimation', name: '16. Cost Estimation Report' },
      { id: 'cost_comparison', name: '17. Cost Comparison Report' },
      { id: 'supplier_comparison', name: '18. Supplier Comparison' }
    ]
  },
  {
    id: 'testing',
    name: 'Quality & Testing',
    icon: <ShieldCheck className="w-4 h-4" />,
    reports: [
      { id: 'qa_inspection', name: '19. Quality Inspection Report' },
      { id: 'routine_test', name: '20. Routine Test Report' },
      { id: 'type_test', name: '21. Type Test Report' },
      { id: 'fat_report', name: '22. FAT Report' }
    ]
  },
  {
    id: 'dispatch',
    name: 'Dispatch & Compliance',
    icon: <Truck className="w-4 h-4" />,
    reports: [
      { id: 'packing_list', name: '23. Packing List' },
      { id: 'name_plate', name: '24. Name Plate Design' },
      { id: 'dispatch_docs', name: '25. Dispatch Documents' },
      { id: 'revision_report', name: '26. Revision Report' },
      { id: 'compliance_report', name: '27. Standards Compliance Report' }
    ]
  }
];

export function ReportsManager({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  const [activeReportId, setActiveReportId] = useState('input_sheet');
  const [printMode, setPrintMode] = useState<'single' | 'all'>('single');

  const handlePrint = (mode: 'single' | 'all') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
      setPrintMode('single'); // Reset after print triggers
    }, 500);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar - Hidden during print */}
      <div className="w-full lg:w-72 shrink-0 print:hidden space-y-6">
        <div className="bg-slate-900 p-4 rounded-xl text-white shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
            <FileText className="w-4 h-4" /> Reports & Docs
          </h3>
          <div className="space-y-2">
            <button 
              onClick={() => handlePrint('all')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold uppercase transition-colors"
            >
              <Printer className="w-4 h-4" /> Print Full Book
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="h-[600px] overflow-y-auto">
            {REPORT_CATEGORIES.map(category => (
              <div key={category.id} className="border-b border-slate-100 last:border-0">
                <div className="bg-slate-50 px-4 py-3 flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider sticky top-0 border-b border-slate-200 z-10">
                  {category.icon} {category.name}
                </div>
                <div className="py-1">
                  {category.reports.map(report => (
                    <button
                      key={report.id}
                      onClick={() => setActiveReportId(report.id)}
                      className={`w-full text-left px-4 py-2 text-[11px] font-semibold transition-colors ${
                        activeReportId === report.id 
                          ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600' 
                          : 'text-slate-600 hover:bg-slate-50 border-l-2 border-transparent'
                      }`}
                    >
                      {report.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Print Area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm min-h-[800px]">
        {/* Header - Hidden during print */}
        <div className="print:hidden border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h2 className="font-bold text-slate-800 text-lg">
            {REPORT_CATEGORIES.flatMap(c => c.reports).find(r => r.id === activeReportId)?.name}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => handlePrint('single')} className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded text-xs font-bold uppercase shadow-sm">
              <Printer className="w-3 h-3" /> Print
            </button>
            <button className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded text-xs font-bold uppercase shadow-sm">
              <FileDown className="w-3 h-3" /> PDF
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-0 sm:p-8 overflow-x-auto print:p-0">
          <div className="print-report-container min-w-[800px] max-w-4xl mx-auto bg-white print:shadow-none shadow-sm border border-slate-200 print:border-none p-10 print:p-0">
            {printMode === 'all' ? (
              <div className="flex flex-col gap-[100px]">
                {REPORT_CATEGORIES.flatMap(c => c.reports).map(report => (
                  <div key={report.id} className="page-break-after">
                    <ReportRenderer reportId={report.id} inputs={inputs} outputs={outputs} />
                  </div>
                ))}
              </div>
            ) : (
              <ReportRenderer reportId={activeReportId} inputs={inputs} outputs={outputs} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
