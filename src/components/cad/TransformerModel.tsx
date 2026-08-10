import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid, Bounds } from '@react-three/drei';
import * as THREE from 'three';
import { TransformerParts, type PartInfo } from './TransformerParts';

export type PresetView = 'iso' | 'front' | 'side' | 'top';

interface CameraRigProps { view: PresetView; viewToken: number; extent: number; }

/** Applies a preset camera position/target. Lives inside <Canvas> so it can
 *  reach the camera and the OrbitControls instance via useThree(). */
function CameraRig({ view, viewToken, extent }: CameraRigProps) {
  const { camera, controls } = useThree((s) => ({ camera: s.camera, controls: s.controls as any }));
  useEffect(() => {
    const d = extent * 1.8;
    const positions: Record<PresetView, [number, number, number]> = {
      iso: [d * 0.7, d * 0.6, d * 0.7],
      front: [0, extent * 0.1, d],
      side: [d, extent * 0.1, 0],
      top: [0.001, d, 0.001],
    };
    const [x, y, z] = positions[view];
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, viewToken, extent]);
  return null;
}

interface TransformerModelProps {
  design: any;
  params: any;
  visibility: Record<string, boolean>;
  exploded: boolean;
  transparency: number;
  view: PresetView;
  viewToken: number;
  sectionEnabled: boolean;
  sectionOffset: number;
  onSelectPart: (part: PartInfo) => void;
}

export function TransformerModel({
  design, params, visibility, exploded, transparency, view, viewToken,
  sectionEnabled, sectionOffset, onSelectPart,
}: TransformerModelProps) {
  const extent = Math.max(design.tankL, design.tankW, design.tankH, design.coreHeight) || 1000;

  const clippingPlanes = useMemo(
    () => (sectionEnabled ? [new THREE.Plane(new THREE.Vector3(0, 0, 1), sectionOffset)] : []),
    [sectionEnabled, sectionOffset],
  );

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [extent * 1.2, extent, extent * 1.2], fov: 45 }}
        onCreated={(state) => { state.gl.localClippingEnabled = true; }}
      >
        <color attach="background" args={['#E4E8E3']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[extent, extent * 2, extent]} intensity={1.5} castShadow shadow-mapSize={2048} />
        <directionalLight position={[-extent, extent, -extent]} intensity={0.5} />

        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.3}>
            <TransformerParts
              design={design} params={params} visibility={visibility}
              exploded={exploded} transparency={transparency}
              clippingPlanes={clippingPlanes} onSelectPart={onSelectPart}
            />
          </Bounds>
          <Environment preset="city" />
        </Suspense>

        <Grid
          renderOrder={-1} position={[0, -1, 0]} infiniteGrid
          cellSize={extent / 20} cellThickness={0.5} sectionSize={extent / 2} sectionThickness={1}
          sectionColor="#78888D" fadeDistance={extent * 15}
        />
        <ContactShadows position={[0, -0.99, 0]} opacity={0.35} scale={extent * 4} blur={2} far={extent} />
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2} minDistance={extent * 0.3} maxDistance={extent * 8} />
        <CameraRig view={view} viewToken={viewToken} extent={extent} />
      </Canvas>
    </div>
  );
}
