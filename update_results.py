import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

# 1. Add 'bom' to activeTab state type
content = content.replace("const [activeTab, setActiveTab] = useState<'overview' | 'winding' | 'core'>('overview');", "const [activeTab, setActiveTab] = useState<'overview' | 'winding' | 'core' | 'bom'>('overview');")

# 2. Add BOM button to tab header
bom_button = """<button onClick={() => setActiveTab('bom')} className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === 'bom' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>BOM & Cost</button>"""
content = content.replace("<button onClick={() => setActiveTab('core')}", bom_button + "\n            <button onClick={() => setActiveTab('core')}")

# 3. Add BOM section
bom_section = """
          {/* BOM TAB */}
          <div className={`${activeTab === 'bom' ? 'block' : 'hidden'} print:block space-y-6`}>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-6">Bill of Materials & Costing</h3>
              
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
                      <th className="px-4 py-3 text-right rounded-tr-lg">Total Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {outputs.bom?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.id}</td>
                        <td className="px-4 py-3 font-medium">{item.category}</td>
                        <td className="px-4 py-3">{item.description}</td>
                        <td className="px-4 py-3 text-right font-mono">{item.quantity.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{item.unit}</td>
                        <td className="px-4 py-3 text-right font-mono">{item.unitRate.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">{item.totalCost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-right uppercase text-xs tracking-wider">Total Raw Material Cost</td>
                      <td className="px-4 py-4 text-right font-mono text-lg text-blue-700">₹{outputs.totalMaterialCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                <div className="text-xs text-blue-800">
                  <span className="font-bold uppercase tracking-wider block mb-1">Cost Breakdown Notes</span>
                  This BOM calculates primary raw materials. For final quotation, add labor, overheads, and target profit margin.
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-blue-600 uppercase tracking-wide font-bold">Est. Selling Price</div>
                  <div className="text-xl font-mono font-bold text-blue-900">₹{outputs.sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
              </div>
            </div>
          </div>
"""

content = content.replace("          {/* CORE TAB */}", bom_section + "\n          {/* CORE TAB */}")

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)

