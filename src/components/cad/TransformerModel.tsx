import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid, Bounds } from '@react-three/drei';
import { TransformerInputs, TransformerOutputs } from '../../types';
import { TransformerParts } from './TransformerParts';

export function TransformerModel({ 
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
  onSelectPart: (part: any) => void
}) {
  return (
    <div className="w-full h-full">
      <Canvas shadows camera={{ position: [0, 2000, 4000], fov: 45 }}>
        <color attach="background" args={['#f8fafc']} />
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={2048}
        />
        <directionalLight position={[-10, 10, -10]} intensity={0.5} />
        
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.2}>
            <TransformerParts 
              inputs={inputs} 
              outputs={outputs}
              visibility={visibility}
              exploded={exploded}
              transparency={transparency}
              onSelectPart={onSelectPart}
            />
          </Bounds>
          
          <Environment preset="city" />
        </Suspense>

        <Grid 
          renderOrder={-1} 
          position={[0, -100, 0]} 
          infiniteGrid 
          cellSize={100} 
          cellThickness={0.5} 
          sectionSize={1000} 
          sectionThickness={1} 
          sectionColor="#94a3b8" 
          fadeDistance={10000} 
        />
        <ContactShadows position={[0, -99, 0]} opacity={0.4} scale={10000} blur={2} far={1000} />
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2} minDistance={500} maxDistance={10000} />
      </Canvas>
    </div>
  );
}
