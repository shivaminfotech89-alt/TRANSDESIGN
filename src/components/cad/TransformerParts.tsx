import React, { useMemo } from 'react';
import * as THREE from 'three';
import { TransformerInputs, TransformerOutputs } from '../../types';
import { ThreeEvent } from '@react-three/fiber';

export function TransformerParts({ 
  inputs, 
  outputs,
  visibility,
  exploded,
  transparency,
  onSelectPart
}: { 
  inputs: TransformerInputs, 
  outputs: TransformerOutputs,
  visibility: any,
  exploded: boolean,
  transparency: number,
  onSelectPart?: (partData: any) => void
}) {
  const {
    coreDia = 150,
    limbCenter = 250,
    windowHeight = 400,
    hvOd = 200,
    hvId = 160,
    hvAxial = 350,
    lvOd = 140,
    lvId = 110,
    lvAxial = 350,
    tankDimensions = { length: 600, width: 400, height: 800 }
  } = outputs;

  // Base geometries calculated once
  const yOffset = (windowHeight + coreDia) / 2; // Center model at y=0 roughly

  // Explode distances
  const explodeFactor = exploded ? 1 : 0;
  const hvExplodeY = explodeFactor * (windowHeight * 0.8);
  const lvExplodeY = explodeFactor * (windowHeight * 1.6);
  const tankExplodeY = explodeFactor * (-tankDimensions.height * 0.5);
  const coverExplodeY = explodeFactor * (tankDimensions.height * 0.6);

  // Materials
  const coreMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#94a3b8', 
    metalness: 0.8, 
    roughness: 0.3 
  }), []);

  const lvMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#d97706', // Copper
    metalness: 0.6, 
    roughness: 0.4,
    side: THREE.DoubleSide
  }), []);

  const hvMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#92400e', // Darker Copper for HV
    metalness: 0.5, 
    roughness: 0.6,
    side: THREE.DoubleSide
  }), []);

  const tankMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#475569', // Slate
    metalness: 0.4, 
    roughness: 0.5,
    transparent: transparency > 0,
    opacity: 1 - (transparency / 100),
    side: THREE.DoubleSide
  }), [transparency]);

  const accessoriesMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#334155', // Dark slate
    metalness: 0.6, 
    roughness: 0.4
  }), []);

  const namePlateMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e2e8f0', // Light silver
    metalness: 0.9,
    roughness: 0.2
  }), []);

  const porcelainMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.1,
    metalness: 0.1
  }), []);

  const positions = [-limbCenter, 0, limbCenter];

  const handlePointerDown = (e: ThreeEvent<PointerEvent>, partData: any) => {
    e.stopPropagation();
    if (onSelectPart) {
      onSelectPart(partData);
    }
  };

  return (
    <group position={[0, yOffset, 0]}>
      {/* 1. Core Assembly */}
      {visibility.core && (
        <group name="Core" onPointerDown={(e) => handlePointerDown(e, {
          name: 'CRGO Stepped Core', partNumber: 'CR-001', material: inputs.coreMaterial,
          weight: outputs.coreWeight?.toFixed(1) + ' kg', dimensions: `Dia: ${coreDia.toFixed(1)}mm, Ht: ${(windowHeight + 2*coreDia).toFixed(1)}mm`,
          cost: '₹' + outputs.totalCoreCost?.toLocaleString('en-IN'), supplier: 'Posco / Nippon',
          drawingRef: 'DRG-CR-001'
        })}>
          {/* Limbs */}
          {positions.map((x, i) => (
            <mesh key={`limb-${i}`} position={[x, 0, 0]} material={coreMaterial} castShadow receiveShadow>
              <cylinderGeometry args={[coreDia/2, coreDia/2, windowHeight, 32]} />
            </mesh>
          ))}
          {/* Top Yoke */}
          <mesh position={[0, windowHeight/2 + coreDia/2, 0]} material={coreMaterial} castShadow receiveShadow>
            <boxGeometry args={[limbCenter * 2 + coreDia, coreDia, coreDia]} />
          </mesh>
          {/* Bottom Yoke */}
          <mesh position={[0, -windowHeight/2 - coreDia/2, 0]} material={coreMaterial} castShadow receiveShadow>
            <boxGeometry args={[limbCenter * 2 + coreDia, coreDia, coreDia]} />
          </mesh>
        </group>
      )}

      {/* 2. LV Windings */}
      {visibility.lvWinding && (
        <group name="LV Windings" position={[0, lvExplodeY, 0]} onPointerDown={(e) => handlePointerDown(e, {
          name: 'LV Coil Assembly', partNumber: 'LV-001', material: inputs.conductor,
          weight: (outputs.copperWeight * 0.45)?.toFixed(1) + ' kg', dimensions: `ID: ${lvId.toFixed(1)}mm, OD: ${lvOd.toFixed(1)}mm, Ht: ${lvAxial.toFixed(1)}mm`,
          cost: '₹' + (outputs.totalConductorCost * 0.45)?.toLocaleString('en-IN'), supplier: 'In-house',
          drawingRef: 'DRG-LV-001'
        })}>
          {positions.map((x, i) => (
            <group key={`lv-${i}`} position={[x, 0, 0]}>
              <mesh material={lvMaterial} castShadow receiveShadow>
                <cylinderGeometry args={[lvOd/2, lvOd/2, lvAxial, 64, 1, true]} />
              </mesh>
              <mesh material={lvMaterial} castShadow receiveShadow>
                <cylinderGeometry args={[lvId/2, lvId/2, lvAxial, 64, 1, true]} />
              </mesh>
              <mesh position={[0, lvAxial/2, 0]} rotation={[Math.PI/2, 0, 0]} material={lvMaterial} castShadow receiveShadow>
                <ringGeometry args={[lvId/2, lvOd/2, 64]} />
              </mesh>
              <mesh position={[0, -lvAxial/2, 0]} rotation={[Math.PI/2, 0, 0]} material={lvMaterial} castShadow receiveShadow>
                <ringGeometry args={[lvId/2, lvOd/2, 64]} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* 3. HV Windings */}
      {visibility.hvWinding && (
        <group name="HV Windings" position={[0, hvExplodeY, 0]} onPointerDown={(e) => handlePointerDown(e, {
          name: 'HV Coil Assembly', partNumber: 'HV-001', material: inputs.conductor,
          weight: (outputs.copperWeight * 0.55)?.toFixed(1) + ' kg', dimensions: `ID: ${hvId.toFixed(1)}mm, OD: ${hvOd.toFixed(1)}mm, Ht: ${hvAxial.toFixed(1)}mm`,
          cost: '₹' + (outputs.totalConductorCost * 0.55)?.toLocaleString('en-IN'), supplier: 'In-house',
          drawingRef: 'DRG-HV-001'
        })}>
          {positions.map((x, i) => (
            <group key={`hv-${i}`} position={[x, 0, 0]}>
              <mesh material={hvMaterial} castShadow receiveShadow>
                <cylinderGeometry args={[hvOd/2, hvOd/2, hvAxial, 64, 1, true]} />
              </mesh>
              <mesh material={hvMaterial} castShadow receiveShadow>
                <cylinderGeometry args={[hvId/2, hvId/2, hvAxial, 64, 1, true]} />
              </mesh>
              <mesh position={[0, hvAxial/2, 0]} rotation={[Math.PI/2, 0, 0]} material={hvMaterial} castShadow receiveShadow>
                <ringGeometry args={[hvId/2, hvOd/2, 64]} />
              </mesh>
              <mesh position={[0, -hvAxial/2, 0]} rotation={[Math.PI/2, 0, 0]} material={hvMaterial} castShadow receiveShadow>
                <ringGeometry args={[hvId/2, hvOd/2, 64]} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* 4. Tank Assembly */}
      {visibility.tank && (
        <group name="Tank Assembly" position={[0, tankExplodeY, 0]}>
          <group onPointerDown={(e) => handlePointerDown(e, {
            name: 'Main Tank & Cover', partNumber: 'TNK-001', material: 'Mild Steel IS 2062',
            weight: (tankDimensions.length * tankDimensions.width * tankDimensions.height * 0.00000003)?.toFixed(1) + ' kg', 
            dimensions: `${tankDimensions.length}x${tankDimensions.width}x${tankDimensions.height} mm`,
            cost: '₹' + (inputs.kVA * 0.9 * (inputs.steelCostPerKg || 85))?.toLocaleString('en-IN'), supplier: 'Fabrication',
            drawingRef: 'DRG-TNK-001'
          })}>
            {/* Main Tank Body */}
            <mesh position={[0, 0, 0]} material={tankMaterial} castShadow receiveShadow>
              <boxGeometry args={[tankDimensions.width, tankDimensions.height, tankDimensions.length]} />
            </mesh>

            {/* Tank Cover */}
            <mesh position={[0, tankDimensions.height/2 + coverExplodeY + 10, 0]} material={tankMaterial} castShadow receiveShadow>
              <boxGeometry args={[tankDimensions.width + 20, 20, tankDimensions.length + 20]} />
            </mesh>
            
            {/* Base Frame & Wheels */}
            <mesh position={[0, -tankDimensions.height/2 - 50, 0]} material={accessoriesMaterial} castShadow receiveShadow>
              <boxGeometry args={[tankDimensions.width, 100, tankDimensions.length]} />
            </mesh>
            <mesh position={[tankDimensions.width/2 - 100, -tankDimensions.height/2 - 120, tankDimensions.length/2 - 100]} material={accessoriesMaterial} rotation={[0, 0, Math.PI/2]} castShadow receiveShadow>
              <cylinderGeometry args={[40, 40, 30, 16]} />
            </mesh>
            <mesh position={[-tankDimensions.width/2 + 100, -tankDimensions.height/2 - 120, tankDimensions.length/2 - 100]} material={accessoriesMaterial} rotation={[0, 0, Math.PI/2]} castShadow receiveShadow>
              <cylinderGeometry args={[40, 40, 30, 16]} />
            </mesh>
            <mesh position={[tankDimensions.width/2 - 100, -tankDimensions.height/2 - 120, -tankDimensions.length/2 + 100]} material={accessoriesMaterial} rotation={[0, 0, Math.PI/2]} castShadow receiveShadow>
              <cylinderGeometry args={[40, 40, 30, 16]} />
            </mesh>
            <mesh position={[-tankDimensions.width/2 + 100, -tankDimensions.height/2 - 120, -tankDimensions.length/2 + 100]} material={accessoriesMaterial} rotation={[0, 0, Math.PI/2]} castShadow receiveShadow>
              <cylinderGeometry args={[40, 40, 30, 16]} />
            </mesh>
          </group>
          
          {/* Accessories attached to Tank */}
          <group onPointerDown={(e) => handlePointerDown(e, {
            name: 'Marshalling Box & Sensors', partNumber: 'MB-001', material: 'Stainless Steel',
            weight: '45 kg', dimensions: '600x400x200 mm',
            cost: '₹25,000', supplier: 'Control Panel OEM', drawingRef: 'DRG-MB-001'
          })}>
            {/* Marshalling Box */}
            <mesh position={[tankDimensions.width/2 + 10, 0, 0]} material={accessoriesMaterial} castShadow receiveShadow>
              <boxGeometry args={[20, 400, 300]} />
            </mesh>
            {/* Name Plate */}
            <mesh position={[-tankDimensions.width/2 - 11, 0, 0]} material={namePlateMaterial} castShadow receiveShadow>
              <boxGeometry args={[2, 200, 300]} />
            </mesh>
            {/* Drain Valve */}
            <mesh position={[0, -tankDimensions.height/2 + 100, tankDimensions.length/2 + 20]} rotation={[Math.PI/2, 0, 0]} material={accessoriesMaterial} castShadow receiveShadow>
              <cylinderGeometry args={[20, 20, 40, 16]} />
            </mesh>
            <mesh position={[0, -tankDimensions.height/2 + 100, tankDimensions.length/2 + 40]} material={lvMaterial} castShadow receiveShadow>
              <cylinderGeometry args={[30, 30, 10, 16]} />
            </mesh>
          </group>

          {/* 5. Radiators */}
          {visibility.radiators && (
            <group name="Radiators" onPointerDown={(e) => handlePointerDown(e, {
              name: 'Cooling Radiator', partNumber: 'RAD-001', material: 'CRCA Steel',
              weight: '120 kg', dimensions: `${tankDimensions.height * 0.7}x150 mm`,
              cost: '₹' + (inputs.kVA * 0.1 * (inputs.steelCostPerKg || 85))?.toLocaleString('en-IN'), supplier: 'Radiator OEM',
              drawingRef: 'DRG-RAD-001'
            })}>
              {/* Radiator Banks with Cooling Fans representation */}
              <group position={[0, 0, tankDimensions.length/2 + 100]}>
                <mesh material={tankMaterial} castShadow receiveShadow>
                  <boxGeometry args={[tankDimensions.width * 0.8, tankDimensions.height * 0.7, 150]} />
                </mesh>
                <mesh position={[0, 100, 80]} material={accessoriesMaterial} castShadow receiveShadow>
                  <cylinderGeometry args={[40, 40, 10, 16]} />
                </mesh>
              </group>
              <group position={[0, 0, -tankDimensions.length/2 - 100]}>
                <mesh material={tankMaterial} castShadow receiveShadow>
                  <boxGeometry args={[tankDimensions.width * 0.8, tankDimensions.height * 0.7, 150]} />
                </mesh>
                <mesh position={[0, 100, -80]} material={accessoriesMaterial} castShadow receiveShadow>
                  <cylinderGeometry args={[40, 40, 10, 16]} />
                </mesh>
              </group>
            </group>
          )}

          {/* 6. Conservator Tank & Accessories */}
          {visibility.conservator && (
            <group name="Conservator" position={[tankDimensions.width/2 - 50, tankDimensions.height/2 + coverExplodeY + 200, tankDimensions.length/2]} onPointerDown={(e) => handlePointerDown(e, {
              name: 'Conservator with Accessories', partNumber: 'CON-001', material: 'Mild Steel IS 2062',
              weight: '95 kg', dimensions: `Dia: 300mm, L: ${tankDimensions.width * 0.8}mm`,
              cost: '₹' + (15000).toLocaleString('en-IN'), supplier: 'Fabrication',
              drawingRef: 'DRG-CON-001'
            })}>
              <mesh material={tankMaterial} rotation={[0, 0, Math.PI/2]} castShadow receiveShadow>
                <cylinderGeometry args={[150, 150, tankDimensions.width * 0.8, 32]} />
              </mesh>
              {/* Pipe connection */}
              <mesh position={[-tankDimensions.width * 0.2, -100, 0]} material={tankMaterial} castShadow receiveShadow>
                <cylinderGeometry args={[25, 25, 200, 16]} />
              </mesh>
              {/* Buchholz Relay on Pipe */}
              <mesh position={[-tankDimensions.width * 0.2, -100, 0]} material={accessoriesMaterial} castShadow receiveShadow>
                <boxGeometry args={[60, 60, 60]} />
              </mesh>
              {/* Breather */}
              <mesh position={[-tankDimensions.width * 0.4 + 20, -50, 100]} material={porcelainMaterial} castShadow receiveShadow>
                <cylinderGeometry args={[30, 30, 80, 16]} />
              </mesh>
            </group>
          )}

          {/* 7. Bushings */}
          {visibility.bushings && (
            <group name="Bushings" position={[0, tankDimensions.height/2 + coverExplodeY + 20, 0]}>
              {/* HV Bushings */}
              {positions.map((x, i) => (
                <group key={`bushing-hv-${i}`} position={[x, 150, 100]} onPointerDown={(e) => handlePointerDown(e, {
                  name: `HV Bushing Phase ${i+1}`, partNumber: 'BSH-HV-01', material: 'Porcelain & Copper',
                  weight: '15 kg', dimensions: '300mm', cost: '₹2500', supplier: 'Bushing OEM', drawingRef: 'DRG-BSH-001'
                })}>
                  <mesh material={porcelainMaterial} castShadow receiveShadow>
                    <cylinderGeometry args={[20, 40, 300, 16]} />
                  </mesh>
                  {[...Array(6)].map((_, j) => (
                    <mesh key={j} position={[0, -100 + j*40, 0]} material={porcelainMaterial} castShadow receiveShadow>
                      <cylinderGeometry args={[50, 20, 10, 16]} />
                    </mesh>
                  ))}
                  <mesh position={[0, 160, 0]} material={hvMaterial}>
                    <cylinderGeometry args={[5, 5, 40, 16]} />
                  </mesh>
                </group>
              ))}
              
              {/* LV Bushings */}
              {positions.map((x, i) => (
                <group key={`bushing-lv-${i}`} position={[x, 100, -150]} onPointerDown={(e) => handlePointerDown(e, {
                  name: `LV Bushing Phase ${i+1}`, partNumber: 'BSH-LV-01', material: 'Porcelain & Copper',
                  weight: '10 kg', dimensions: '200mm', cost: '₹1200', supplier: 'Bushing OEM', drawingRef: 'DRG-BSH-002'
                })}>
                  <mesh material={porcelainMaterial} castShadow receiveShadow>
                    <cylinderGeometry args={[30, 40, 200, 16]} />
                  </mesh>
                  {[...Array(4)].map((_, j) => (
                    <mesh key={j} position={[0, -50 + j*30, 0]} material={porcelainMaterial} castShadow receiveShadow>
                      <cylinderGeometry args={[45, 30, 10, 16]} />
                    </mesh>
                  ))}
                  <mesh position={[0, 110, 0]} material={lvMaterial}>
                    <cylinderGeometry args={[15, 15, 30, 16]} />
                  </mesh>
                </group>
              ))}
              {/* Neutral Bushing */}
              <group position={[limbCenter + 150, 100, -150]} onPointerDown={(e) => handlePointerDown(e, {
                  name: `Neutral Bushing`, partNumber: 'BSH-LV-01', material: 'Porcelain & Copper',
                  weight: '10 kg', dimensions: '200mm', cost: '₹1200', supplier: 'Bushing OEM', drawingRef: 'DRG-BSH-002'
              })}>
                <mesh material={porcelainMaterial} castShadow receiveShadow>
                  <cylinderGeometry args={[30, 40, 200, 16]} />
                </mesh>
                <mesh position={[0, 110, 0]} material={lvMaterial}>
                  <cylinderGeometry args={[15, 15, 30, 16]} />
                </mesh>
              </group>
            </group>
          )}
        </group>
      )}
    </group>
  );
}
