
export type StandardType = 'IEC 60076' | 'IEEE C57' | 'IS 1180' | 'EcoDesign';
export type InsulationClass = 'A' | 'B' | 'F' | 'H';

export type CoolingMethod = 'Dry Type' | 'Oil Immersed';
export type CoreMaterial = 'CRGO Conventional' | 'CRGO Hi-B' | 'Amorphous';
export type ConductorMaterial = 'Copper' | 'Aluminum';
export type OptimizationStrategy = 'Lowest Cost' | 'High Efficiency';


export type VectorGroup = 'Dyn11' | 'Yyn0' | 'YNd11' | 'Dd0';
export type CoreType = 'Step-Lap' | 'Conventional Mitered' | 'Amorphous' | 'EI Core';
export type TankType = 'Radiator & Conservator' | 'Corrugated Fin' | 'Sealed Type';
export type TapChanger = 'None' | 'OCTC' | 'OLTC';

export interface BomItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitRate: number;
  totalCost: number;
}

export interface TransformerInputs {
  projectName?: string;
  kVA: number;
  hvVoltage: number;
  lvVoltage: number;
  phases: number;
  targetImpedance?: number;
  targetLoadLoss?: number;
  targetNoLoadLoss?: number;
  frequency: number;
  cooling: CoolingMethod;
  coreMaterial: CoreMaterial;
  conductor: ConductorMaterial;
  strategy: OptimizationStrategy;
  coreCostPerKg: number;
  conductorCostPerKg: number;
  marginPercentage: number;
  targetBudget?: number;

  // Extended inputs
  vectorGroup?: VectorGroup;
  coreType?: CoreType;
  tankType?: TankType;

  referenceStandard?: StandardType;
  insulationClass?: InsulationClass;
  maxFluxDensity?: number;
  maxCurrentDensityHv?: number;
  maxCurrentDensityLv?: number;

  tapChanger?: TapChanger;
  tapRangeAbove?: number;
  tapRangeBelow?: number;
  tapStepVariation?: number;
  ambientTemp?: number;
  tempRise?: number;
  oilCostPerLitre?: number;
  steelCostPerKg?: number;

}

export interface CoreStep {
  step: number;
  width: number;
  thickness: number;
  weight: number;
}

export interface PlateData {
  sNo: number;
  a: number;
  stepWidth: number;
  weight: number;
}

export interface TransformerOutputs {
  // 1. Summary
  strategyMessage: string;
  complianceNote: string;
  
  // 2. Calculations
  sPhase: number;
  kFactor: number;
  et: number;
  bm: number;
  ai: number; // m^2
  ag: number; // m^2
  coreDia: number; // mm
  hvPhaseVoltage: number;
  lvPhaseVoltage: number;
  hvPhaseCurrent: number;
  lvPhaseCurrent: number;
  hvTurns: number;
  lvTurns: number;
  currentDensity: number;
  hvArea: number;
  lvArea: number;
  
  // 3. Winding
  hvWindingType: string;
  lvWindingType: string;
  
  // 4. Core Chart
  coreSteps: CoreStep[];
  plateA: PlateData[];
  plateB: PlateData[];
  plateC: PlateData[];
  
  // Winding Detailed Dimensions
  tapPositions?: number;
  turnsPerStep?: number;
  tapStepsList?: number[];
  validationWarnings?: string[];
  hiloGap: number;
  lvId: number;
  lvOd: number;
  lvCondWidth: number;
  lvCondThick: number;
  lvLayers: number;
  lvTpl: number;
  lvAxial: number;
  
  hvId: number;
  hvOd: number;
  hvCondWidth: number;
  hvCondThick: number;
  hvLayers: number;
  hvTpl: number;
  hvAxial: number;
  
  turnsDistribution?: { label: string; turns: number; total: number }[];
  spacerDistribution?: { label: string; thickness: number; total: number }[];
  totalHvTurnsDisplay?: number;
  totalSpacerThickness?: number;
  
  ratio: number;

  // 5. Metrics
  noLoadLosses: number;
  loadLosses: number;
  impedance: number;
  copperWeight: number;
  coreWeight: number;
  efficiency: {
    load25: number;
    load50: number;
    load75: number;
    load100: number;
  };
  
  // 6. Cost Analysis
  totalCoreCost: number;
  totalConductorCost: number;
  totalMaterialCost: number;
  sellingPrice: number;
  suggestedStrategy: string;

  // Tank and Thermal Metrics
  tankDimensions?: { length: number; width: number; height: number; weight: number };
  oilQuantity?: number;
  totalWeight?: number;
  windowHeight?: number;
  limbCenter?: number;
  tempRise?: number;
  tempGradient?: number;
  thermalTimeConstant?: number;
  // 7. BOM & Costing
  bom: BomItem[];

  budgetAnalysis?: {
    isWithinBudget: boolean;
    variance: number;
    pros: string[];
    cons: string[];
    suggestedMods: string[];
  };
}

