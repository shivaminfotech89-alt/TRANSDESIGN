import { exportToExcel } from "../lib/exportUtils";
import React, { useRef, useState } from "react";
import { TransformerOutputs, TransformerInputs } from "../types";
import {
  Download,
  FileText,
  CheckCircle2,
  CloudUpload,
  FileSpreadsheet,
} from "lucide-react";
import { CorePartsDesignTab } from "./CorePartsDesignTab";
import { WindingDesignTab } from "./WindingDesignTab";
import { ReportsManager } from "./reports/ReportsManager";
import { CadViewerTab } from "./cad/CadViewerTab";

export function ResultsDisplay({
  outputs,
  inputs,
}: {
  outputs: TransformerOutputs;
  inputs: TransformerInputs;
}) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "calculations" | "winding" | "core" | "bom" | "reports" | "3d-model"
  >("overview");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const generatePDF = () => {
    window.print();
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const designId = `TDE-${inputs.kVA}-${Math.round(inputs.hvVoltage / 1000)}-${inputs.lvVoltage}`;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col order-2 lg:order-1">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 print:hidden shrink-0">
          <div className="flex gap-2 border-b border-slate-200 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === "overview" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-900"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("calculations")}
              className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === "calculations" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-900"}`}
            >
              Calculations
            </button>
            <button
              onClick={() => setActiveTab("winding")}
              className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === "winding" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-900"}`}
            >
              Winding Design
            </button>
            <button
              onClick={() => setActiveTab("bom")}
              className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === "bom" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-900"}`}
            >
              BOM & Cost
            </button>
            <button
              onClick={() => setActiveTab("core")}
              className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === "core" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-900"}`}
            >
              Core Parts
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === "reports" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-emerald-900"}`}
            >
              Reports & Docs
            </button>
            <button
              onClick={() => setActiveTab("3d-model")}
              className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === "3d-model" ? "text-purple-600 border-b-2 border-purple-600" : "text-slate-500 hover:text-purple-900"}`}
            >
              3D CAD Model
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 px-4 py-2 text-xs font-semibold uppercase rounded-md shadow-sm transition-colors"
            >
              {saveSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              {saveSuccess ? "Saved" : isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => exportToExcel(inputs, outputs)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold uppercase rounded-md shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold uppercase rounded-md shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4" /> PDF Report
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 print:w-full" ref={reportRef}>
          {/* OVERVIEW TAB */}
          <div
            className={`${activeTab === "overview" ? "block" : "hidden"} print:hidden space-y-8`}
          >
            {/* Header section in overview */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-1">
                {inputs.kVA} kVA Transformer Design
              </h2>
              <p className="text-slate-500 text-sm">
                Design ID: {designId} • {inputs.phases} Phase • {inputs.cooling}
              </p>
            </div>

            {/* 1. ELECTRICAL CALCULATIONS */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-blue-600 text-xs tracking-wider mb-4 font-bold uppercase">
                01. Electromagnetic Core Design
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs mb-1 uppercase tracking-wide">
                    Volts per Turn (Et)
                  </span>
                  <span className="font-semibold text-slate-900">
                    {outputs.et.toFixed(3)} V
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs mb-1 uppercase tracking-wide">
                    Max Flux (Bm)
                  </span>
                  <span className="font-semibold text-slate-900">
                    {outputs.bm.toFixed(2)} Tesla
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs mb-1 uppercase tracking-wide">
                    Net Iron Area (Ai)
                  </span>
                  <span className="font-semibold text-slate-900">
                    {outputs.ai.toFixed(4)} m²
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs mb-1 uppercase tracking-wide">
                    Core Dia
                  </span>
                  <span className="font-semibold text-slate-900">
                    {outputs.coreDia.toFixed(1)} mm
                  </span>
                </div>
              </div>
            </div>

            {/* 2. WINDING SUMMARY */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-blue-600 text-xs tracking-wider mb-4 font-bold uppercase">
                02. Winding Architecture
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="font-semibold text-slate-800 border-b border-slate-100 pb-2">
                    HV Winding{" "}
                    <span className="text-slate-500 text-sm font-normal ml-2">
                      ({outputs.hvWindingType})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Voltage</span>
                      <span className="font-medium text-slate-900">
                        {inputs.hvVoltage} V
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Current</span>
                      <span className="font-medium text-slate-900">
                        {outputs.hvPhaseCurrent.toFixed(1)} A
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Turns</span>
                      <span className="font-medium text-slate-900">
                        {outputs.hvTurns}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Cond. Area</span>
                      <span className="font-medium text-slate-900">
                        {outputs.hvArea.toFixed(2)} mm²
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="font-semibold text-slate-800 border-b border-slate-100 pb-2">
                    LV Winding{" "}
                    <span className="text-slate-500 text-sm font-normal ml-2">
                      ({outputs.lvWindingType})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Voltage</span>
                      <span className="font-medium text-slate-900">
                        {inputs.lvVoltage} V
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Current</span>
                      <span className="font-medium text-slate-900">
                        {outputs.lvPhaseCurrent.toFixed(1)} A
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Turns</span>
                      <span className="font-medium text-slate-900">
                        {outputs.lvTurns}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Cond. Area</span>
                      <span className="font-medium text-slate-900">
                        {outputs.lvArea.toFixed(2)} mm²
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. MESSAGE & STRATEGY */}
            <div className="bg-slate-800 p-6 rounded-xl text-white">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-bold">
                Optimization Summary & Standards Compliance
              </div>
              <p className="text-sm leading-relaxed mb-3">
                {outputs.strategyMessage}
              </p>
              <div className="text-xs bg-slate-700/50 p-3 rounded-lg border border-slate-600/50 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">{outputs.complianceNote}</span>
              </div>
            </div>
          </div>

          {/* WINDING TAB */}
          <div
            className={`${activeTab === "winding" ? "block" : "hidden"} print:block space-y-6`}
          >
            <WindingDesignTab inputs={inputs} outputs={outputs} />
          </div>

          {/* 3D CAD MODEL TAB */}
          {activeTab === "3d-model" && (
            <div className="space-y-6 animate-in fade-in duration-300 print:hidden h-[800px]">
              <CadViewerTab inputs={inputs} outputs={outputs} />
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === "reports" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <ReportsManager inputs={inputs} outputs={outputs} />
            </div>
          )}

          {/* BOM TAB */}
          <div
            className={`${activeTab === "bom" ? "block" : "hidden"} print:block space-y-6`}
          >
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-6">
                Bill of Materials & Costing
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Item Code</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Quantity</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3 text-right">Unit Rate (₹)</th>
                      <th className="px-4 py-3 text-right rounded-tr-lg">
                        Total Cost (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {outputs.bom?.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {item.id}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {item.category}
                        </td>
                        <td className="px-4 py-3">{item.description}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {item.quantity.toLocaleString(undefined, {
                            maximumFractionDigits: 1,
                          })}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {item.unitRate.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                          {item.totalCost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-4 text-right uppercase text-xs tracking-wider"
                      >
                        Total Raw Material Cost
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-lg text-blue-700">
                        ₹
                        {outputs.totalMaterialCost.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                <div className="text-xs text-blue-800">
                  <span className="font-bold uppercase tracking-wider block mb-1">
                    Cost Breakdown Notes
                  </span>
                  This BOM calculates primary raw materials. For final
                  quotation, add labor, overheads, and target profit margin.
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-blue-600 uppercase tracking-wide font-bold">
                    Est. Selling Price
                  </div>
                  <div className="text-xl font-mono font-bold text-blue-900">
                    ₹
                    {outputs.sellingPrice.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CALCULATIONS TAB */}
          <div
            className={`${activeTab === "calculations" ? "block" : "hidden"} print:block space-y-6`}
          >
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
              <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Engineering Calculations
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 bg-slate-50 p-2 rounded">
                    Electrical & Core
                  </h4>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-[10px] uppercase text-slate-500">
                      <tr>
                        <th className="py-1 px-2 text-left">Parameter</th>
                        <th className="py-1 px-2 text-left hidden lg:table-cell">
                          Equation
                        </th>
                        <th className="py-1 px-2 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          kVA / Phase (Q)
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          Total kVA / Phases
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.sPhase.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          Voltage Per Turn (Et)
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          K × √(Q)
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.et.toFixed(4)} V
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">K Factor</td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          Constant
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.kFactor.toFixed(3)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          Flux Density (Bm)
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          Target Limit
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.bm.toFixed(3)} T
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          Net Iron Area (Ai)
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          Et / (4.44 × f × Bm)
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {(outputs.ai * 10000).toFixed(2)} cm²
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          Gross Iron Area (Ag)
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          Ai / Stacking Factor
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {(outputs.ag * 10000).toFixed(2)} cm²
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          Core Diameter
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          √((4 × Ag) / (π × Ks))
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.coreDia.toFixed(1)} mm
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          HV Phase Voltage
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          HV / (√3 if 3-ph)
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.hvPhaseVoltage.toFixed(1)} V
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          LV Phase Voltage
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          LV / (√3 if 3-ph)
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.lvPhaseVoltage.toFixed(1)} V
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          Turns Ratio
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          HV / LV
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.ratio.toFixed(3)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          Core Stack Steps
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          Algorithm
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.coreSteps.length}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          H-L Clearance
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          BIL dependent
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.hiloGap} mm
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 bg-slate-50 p-2 rounded">
                    Currents & Winding
                  </h4>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-[10px] uppercase text-slate-500">
                      <tr>
                        <th className="py-1 px-2 text-left">Parameter</th>
                        <th className="py-1 px-2 text-left hidden lg:table-cell">
                          Equation
                        </th>
                        <th className="py-1 px-2 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          HV Phase Current
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          kVA / (Phases × HV Phase V)
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.hvPhaseCurrent.toFixed(2)} A
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          LV Phase Current
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          kVA / (Phases × LV Phase V)
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.lvPhaseCurrent.toFixed(2)} A
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          Current Density
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          Max Allowed
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.currentDensity.toFixed(3)} A/mm²
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">HV Area</td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          HV Current / Density
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.hvArea.toFixed(2)} mm²
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">LV Area</td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          LV Current / Density
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.lvArea.toFixed(2)} mm²
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          HV Turns (Tap)
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          HV Phase V / Et
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.hvTurns}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">LV Turns</td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          LV Phase V / Et
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.lvTurns}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">Impedance</td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          %Z + (Wc / (kVA×10)) (Est.)
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.impedance.toFixed(3)} %
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">
                          No-Load Loss
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          Core Wt × Sp. Loss
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.noLoadLosses} W
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-600">Load Loss</td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                          I²R + Stray (Target)
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {outputs.loadLosses} W
                        </td>
                      </tr>
                      {outputs.tapPositions ? (
                        <>
                          <tr>
                            <td className="py-2 px-2 text-slate-600">
                              Tap Positions
                            </td>
                            <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                              Calculated
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-medium">
                              {outputs.tapPositions}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2 text-slate-600">
                              Turns Per Step
                            </td>
                            <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                              HV Turns × %Step
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-medium">
                              {outputs.turnsPerStep?.toFixed(1)}
                            </td>
                          </tr>
                        </>
                      ) : null}
                    </tbody>
                  </table>
                  <div className="mt-8">
                    <h4 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">
                      Overall Dimensions & Thermal Checks
                    </h4>
                    <table className="w-full text-sm border-t border-slate-200">
                      <thead className="bg-slate-100 text-[10px] uppercase text-slate-500">
                        <tr>
                          <th className="py-1 px-2 text-left">Parameter</th>
                          <th className="py-1 px-2 text-left hidden lg:table-cell">
                            Equation
                          </th>
                          <th className="py-1 px-2 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-2 px-2 text-slate-600">
                            Core Stack Height (Window)
                          </td>
                          <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                            HV Axial + Clearance
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-medium">
                            {outputs.windowHeight} mm
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-slate-600">
                            Limb Center Distance
                          </td>
                          <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                            Core Dia + HV Radial + Gap
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-medium">
                            {outputs.limbCenter} mm
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-slate-600">
                            Tank Dimensions (L×W×H)
                          </td>
                          <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                            Limb×Phases + Clearances
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-medium">
                            {outputs.tankDimensions?.length} ×{" "}
                            {outputs.tankDimensions?.width} ×{" "}
                            {outputs.tankDimensions?.height} mm
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-slate-600">
                            Transformer Oil Required
                          </td>
                          <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                            kVA × 2.1 (Approx)
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-medium">
                            {outputs.oilQuantity} L
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-slate-600">
                            Tank Empty Weight
                          </td>
                          <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                            Volume × Factor
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-medium">
                            {outputs.tankDimensions?.weight} kg
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-slate-600">
                            Total Transformer Weight
                          </td>
                          <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                            Core+Winding+Tank+Oil
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-medium">
                            {outputs.totalWeight?.toFixed(1)} kg
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-slate-600">
                            Temperature Rise (Oil)
                          </td>
                          <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                            Given limit
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-medium">
                            {outputs.tempRise} °C
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-slate-600">
                            Temperature Gradient
                          </td>
                          <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                            Winding - Oil Rise
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-medium">
                            {outputs.tempGradient} °C
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-slate-600">
                            Thermal Time Constant
                          </td>
                          <td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">
                            (Wt × C) / Losses
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-medium">
                            {outputs.thermalTimeConstant} Hrs
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CORE TAB */}
          <div
            className={`${activeTab === "core" ? "block" : "hidden"} print:block space-y-6`}
          >
            <CorePartsDesignTab inputs={inputs} outputs={outputs} />
          </div>
        </div>
      </div>

      {/* Right Sidebar (Metrics & Budget) */}
      <aside className="w-full lg:w-[320px] order-1 lg:order-2 flex flex-col gap-6 print:hidden">
        {/* Performance Metrics Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xs font-bold text-slate-800 tracking-wide uppercase mb-5">
            Performance Metrics
          </h2>
          <div className="space-y-5">
            <div className="flex justify-between items-end border-b border-slate-100 pb-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Total Losses
                </div>
                <div className="text-xl font-semibold text-slate-900">
                  {((outputs.noLoadLosses + outputs.loadLosses) / 1000).toFixed(
                    2,
                  )}{" "}
                  <span className="text-sm text-slate-500 font-normal">kW</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase">
                  No Load
                </div>
                <div className="text-sm font-medium text-slate-700">
                  {outputs.noLoadLosses} W
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-b border-slate-100 pb-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Impedance
                </div>
                <div className="text-xl font-semibold text-slate-900">
                  {outputs.impedance.toFixed(2)}{" "}
                  <span className="text-sm text-slate-500 font-normal">%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase">
                  Resistance
                </div>
                <div className="text-sm font-medium text-slate-700">
                  {(outputs.impedance * 0.8).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Peak Efficiency
                </div>
                <div className="text-xl font-semibold text-emerald-600">
                  {Math.max(
                    outputs.efficiency.load25,
                    outputs.efficiency.load50,
                    outputs.efficiency.load75,
                    outputs.efficiency.load100,
                  ).toFixed(2)}
                  %
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase">
                  Current Dens.
                </div>
                <div className="text-sm font-medium text-slate-700">
                  {outputs.currentDensity.toFixed(2)} A/mm²
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Analysis Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          {outputs.budgetAnalysis && (
            <div
              className={`absolute top-0 left-0 w-full h-1 ${outputs.budgetAnalysis.isWithinBudget ? "bg-emerald-500" : "bg-red-500"}`}
            ></div>
          )}
          <h2 className="text-xs font-bold text-slate-800 tracking-wide uppercase mb-5">
            Cost Analysis (INR)
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Material Cost
                </div>
                <div className="text-lg font-semibold text-slate-700 font-mono">
                  ₹{" "}
                  {outputs.totalMaterialCost.toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Est. Selling Price
                </div>
                <div className="text-2xl font-bold text-blue-600 font-mono">
                  ₹{" "}
                  {outputs.sellingPrice.toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase mb-1">
                Suggested Design Strategy
              </div>
              <div className="text-xs text-blue-600 font-medium bg-blue-50 p-2 rounded-md border border-blue-100">
                {outputs.suggestedStrategy}
              </div>
            </div>

            {outputs.budgetAnalysis && (
              <div className="pt-4 border-t border-slate-100 mt-4">
                <div className="text-xs font-bold uppercase mb-3 flex items-center justify-between">
                  <span className="text-slate-800">Budget Analysis</span>
                  <span
                    className={`px-2 py-1 rounded-md text-[10px] font-bold ${outputs.budgetAnalysis.isWithinBudget ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                  >
                    {outputs.budgetAnalysis.isWithinBudget
                      ? "Within Budget"
                      : "Exceeds Budget"}
                  </span>
                </div>

                <div className="space-y-4">
                  {!outputs.budgetAnalysis.isWithinBudget && (
                    <div className="text-[11px] font-bold text-red-700 bg-red-50 p-2 rounded-md border border-red-200 flex justify-between">
                      <span>Variance:</span>
                      <span>
                        +₹
                        {outputs.budgetAnalysis.variance.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          },
                        )}
                      </span>
                    </div>
                  )}

                  <div className="text-xs">
                    <div className="font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Pros
                    </div>
                    <ul className="list-disc pl-4 text-slate-600 space-y-1 text-[11px]">
                      {outputs.budgetAnalysis.pros.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-xs">
                    <div className="font-semibold text-red-700 mb-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      Cons
                    </div>
                    <ul className="list-disc pl-4 text-slate-600 space-y-1 text-[11px]">
                      {outputs.budgetAnalysis.cons.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-blue-700 font-bold mb-2">
                      Design Adjustments
                    </div>
                    <ul className="list-disc pl-4 text-slate-700 space-y-1 text-[11px]">
                      {outputs.budgetAnalysis.suggestedMods.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
