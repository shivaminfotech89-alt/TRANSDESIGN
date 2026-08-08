import { calculateTransformer } from './src/lib/engine.js';
console.log(calculateTransformer({
    kVA: 0,
    hvVoltage: 11000,
    lvVoltage: 433,
    phases: 3,
    frequency: 50,
    cooling: 'Oil Immersed',
    coreMaterial: 'CRGO Conventional',
    conductor: 'Copper',
    strategy: 'Lowest Cost',
    coreCostPerKg: 350,
    conductorCostPerKg: 900,
    marginPercentage: 15.0,
}));
