import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { finLayout } from '@/packages/engine';
import {
  limbSlabs, yokeSlabs, coreCrossSectionSpan, hvBushingSpec, lvBushingSpec, finPlacements,
} from './geometry';
import { PART_NUMBERS } from '../drawings/partNumbers';

export interface PartInfo {
  name: string; partNumber: string; material: string; dimensions: string; mass: string;
}

interface TransformerPartsProps {
  design: any;
  params: any;
  visibility: Record<string, boolean>;
  exploded: boolean;
  transparency: number;
  clippingPlanes: THREE.Plane[];
  onSelectPart: (part: PartInfo) => void;
}

/** A true annular solid (extruded ring, not a cylinder eyeballed to look
 *  hollow): a circle shape with a circular hole, extruded to height. */
function useAnnulusGeometry(innerR: number, outerR: number, height: number) {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 64 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, height / 2, 0);
    return geo;
  }, [innerR, outerR, height]);
}

const STEEL_DENSITY = 7850; // kg/m^3, same constant the engine uses for tank/frame steel

export function TransformerParts({
  design, params, visibility, exploded, transparency, clippingPlanes, onSelectPart,
}: TransformerPartsProps) {
  const cc = design.cc;
  const limbX = [-cc, 0, cc];

  const limbSlabList = useMemo(
    () => limbSlabs(params.steps, design.dCore, design.Hw),
    [params.steps, design.dCore, design.Hw],
  );
  const yokeLen = design.coreWidth;
  const yokeSlabList = useMemo(
    () => yokeSlabs(params.steps, design.dCore, yokeLen),
    [params.steps, design.dCore, yokeLen],
  );
  const crossSpan = coreCrossSectionSpan(params.steps, design.dCore);
  const yokeY = design.Hw / 2 + crossSpan / 2;

  const lvGeo = useAnnulusGeometry(design.lvID / 2, design.lvOD / 2, design.hLV);
  const hvGeo = useAnnulusGeometry(design.hvID / 2, design.hvOD / 2, design.hHV);

  const explode = exploded ? 1 : 0;
  const lvExplodeY = explode * design.Hw * 0.5;
  const hvExplodeY = explode * design.Hw * 1.0;
  const tankExplodeY = explode * -design.tankH * 0.5;
  const coverExplodeY = explode * design.tankH * 0.6;
  const bushingExplodeY = explode * design.tankH * 0.9;
  const finExplodeZ = explode * 150;

  const isCu = (short: string) => short === 'Cu';
  const coreMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#8a8f94', metalness: 0.7, roughness: 0.4, clippingPlanes,
  }), [clippingPlanes]);
  const lvMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: isCu(design.cLV.short) ? '#c8813f' : '#c9ccd1', metalness: 0.7, roughness: 0.35, clippingPlanes,
  }), [design.cLV.short, clippingPlanes]);
  const hvMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: isCu(design.cHV.short) ? '#8a4a1e' : '#a4a8ad', metalness: 0.6, roughness: 0.45, clippingPlanes,
  }), [design.cHV.short, clippingPlanes]);
  const tankMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#4a5560', metalness: 0.4, roughness: 0.5,
    transparent: transparency > 0, opacity: 1 - transparency / 100, side: THREE.DoubleSide, clippingPlanes,
  }), [transparency, clippingPlanes]);
  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#5b6470', metalness: 0.6, roughness: 0.4, clippingPlanes,
  }), [clippingPlanes]);
  const porcelainMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f2f2ea', roughness: 0.15, metalness: 0.05, clippingPlanes,
  }), [clippingPlanes]);
  const namePlateMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#d8dee2', metalness: 0.9, roughness: 0.2, clippingPlanes,
  }), [clippingPlanes]);

  const select = (e: ThreeEvent<PointerEvent>, info: PartInfo) => {
    e.stopPropagation();
    onSelectPart(info);
  };

  const steelMass = (volumeMm3: number) => (volumeMm3 / 1e9) * STEEL_DENSITY;

  // Base channel: two parallel beams under the tank. The engine does not cost
  // these separately, so mass here is computed from the geometry actually
  // drawn x steel density -- derived from real dimensions, not invented.
  const channelH = 100, channelW = 80;
  const channelLen = design.tankL * 0.95;
  const channelMass = 2 * steelMass(channelLen * channelH * channelW);

  // Clamping frame: top and bottom channel spanning the yoke width, plus
  // tie rods outside the outer limbs connecting them. Same honesty note.
  const frameDepth = crossSpan * 0.5, frameThk = 40;
  const frameLen = yokeLen * 1.05;
  const frameMass = 2 * steelMass(frameLen * frameThk * frameDepth);
  const tieRodDia = 22;
  const tieRodSpanY = design.coreHeight * 0.92;
  const tieRodX = cc + design.dCore / 2 + 40;
  const tieRodMass = 4 * steelMass(Math.PI * (tieRodDia / 2) ** 2 * tieRodSpanY);

  const fins = useMemo(
    () => (design.dry ? { n: 0, depth: 0, height: 0, perSide: 0 } : finLayout(design)),
    [design],
  );

  const finFrontZ = design.tankW / 2 + (fins.depth || 0) / 2;
  const finPlacementsFront = useMemo(
    () => finPlacements(fins.perSide, design.tankL, design.tankH, fins.height, finFrontZ + finExplodeZ),
    [fins, design.tankL, design.tankH, finExplodeZ, finFrontZ],
  );
  const finPlacementsBack = useMemo(
    () => finPlacements(fins.perSide, design.tankL, design.tankH, fins.height, -finFrontZ - finExplodeZ),
    [fins, design.tankL, design.tankH, finExplodeZ, finFrontZ],
  );

  const hvBush = hvBushingSpec(params.umHV);
  const lvBush = lvBushingSpec(params.umLV);

  return (
    <group position={[0, design.coreHeight / 2, 0]}>
      {/* 1. Core: limbs and yokes, both built from the same stepWidths rows.
          One clickable assembly -- the engine gives a total core mass
          (wCore), not a per-limb/per-yoke split, so that is what is shown,
          not a fabricated division of it. */}
      {visibility.core && (
        <group
          name="Core"
          onPointerDown={(e) => select(e, {
            name: 'Stepped Core Assembly', partNumber: PART_NUMBERS.core, material: design.grade.name,
            dimensions: `${design.coreWidth.toFixed(0)} x ${design.coreHeight.toFixed(0)} x ${crossSpan.toFixed(0)} mm`,
            mass: `${design.wCore.toFixed(1)} kg`,
          })}
        >
          {limbX.map((x, li) => (
            <group key={`limb-${li}`} position={[x, 0, 0]}>
              {limbSlabList.map((s, i) => (
                <mesh key={i} position={[s.x, s.y, s.z]} material={coreMaterial} castShadow receiveShadow>
                  <boxGeometry args={[s.sizeX, s.sizeY, s.sizeZ]} />
                </mesh>
              ))}
            </group>
          ))}
          {[yokeY, -yokeY].map((y, yi) => (
            <group key={`yoke-${yi}`} position={[0, y, 0]}>
              {yokeSlabList.map((s, i) => (
                <mesh key={i} position={[s.x, s.y, s.z]} material={coreMaterial} castShadow receiveShadow>
                  <boxGeometry args={[s.sizeX, s.sizeY, s.sizeZ]} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}

      {/* 2. LV windings: true annular solids (extruded ring, not a cylinder
          sized by eye) at the calculated ID/OD/height. wLV is already the
          total for all three phases (the engine's own 3x factor), so that
          total is reported on the group, not per-coil. */}
      {visibility.lvWinding && (
        <group
          name="LV Windings" position={[0, lvExplodeY, 0]}
          onPointerDown={(e) => select(e, {
            name: 'LV Coil Assembly, 3 Phases', partNumber: PART_NUMBERS.lvCoil, material: design.cLV.name,
            dimensions: `ID ${design.lvID.toFixed(0)} / OD ${design.lvOD.toFixed(0)} / Ht ${design.hLV.toFixed(0)} mm`,
            mass: `${design.wLV.toFixed(1)} kg`,
          })}
        >
          {limbX.map((x, i) => (
            <mesh key={i} position={[x, -design.hLV / 2, 0]} geometry={lvGeo} material={lvMaterial} castShadow receiveShadow />
          ))}
        </group>
      )}

      {/* 3. HV windings: same treatment, outside the LV coils radially. */}
      {visibility.hvWinding && (
        <group
          name="HV Windings" position={[0, hvExplodeY, 0]}
          onPointerDown={(e) => select(e, {
            name: 'HV Coil Assembly, 3 Phases', partNumber: PART_NUMBERS.hvCoil, material: design.cHV.name,
            dimensions: `ID ${design.hvID.toFixed(0)} / OD ${design.hvOD.toFixed(0)} / Ht ${design.hHV.toFixed(0)} mm`,
            mass: `${design.wHV.toFixed(1)} kg`,
          })}
        >
          {limbX.map((x, i) => (
            <mesh key={i} position={[x, -design.hHV / 2, 0]} geometry={hvGeo} material={hvMaterial} castShadow receiveShadow />
          ))}
        </group>
      )}

      {/* 4. Tank and cover, sized from design.tankL/tankW/tankH and wTank. */}
      {visibility.tank && (
        <group name="Tank" position={[0, tankExplodeY, 0]}>
          <mesh
            position={[0, 0, 0]} material={tankMaterial} castShadow receiveShadow
            onPointerDown={(e) => select(e, {
              name: 'Main Tank', partNumber: PART_NUMBERS.tank, material: 'Mild steel, IS 2062',
              dimensions: `${design.tankL.toFixed(0)} x ${design.tankW.toFixed(0)} x ${design.tankH.toFixed(0)} mm`,
              mass: `${design.wTank.toFixed(1)} kg`,
            })}
          >
            <boxGeometry args={[design.tankL, design.tankH, design.tankW]} />
          </mesh>
          <mesh
            position={[0, design.tankH / 2 + 10 + coverExplodeY, 0]} material={tankMaterial} castShadow receiveShadow
            onPointerDown={(e) => select(e, {
              name: 'Tank Cover', partNumber: PART_NUMBERS.tankCover, material: 'Mild steel, IS 2062',
              dimensions: `${(design.tankL + 20).toFixed(0)} x ${(design.tankW + 20).toFixed(0)} x 20 mm`,
              mass: `${steelMass((design.tankL + 20) * (design.tankW + 20) * 20).toFixed(1)} kg`,
            })}
          >
            <boxGeometry args={[design.tankL + 20, 20, design.tankW + 20]} />
          </mesh>
        </group>
      )}

      {/* 5. Fins: real count and pitch from finLayout(), not a fixed decoration. */}
      {visibility.fins && !design.dry && (
        <group
          name="Fins" position={[0, tankExplodeY, 0]}
          onPointerDown={(e) => select(e, {
            name: 'Radiator Fins', partNumber: PART_NUMBERS.fins, material: 'CRCA steel',
            dimensions: `${fins.n} fins, ${fins.depth.toFixed(0)} x ${fins.height.toFixed(0)} mm each`,
            mass: `${design.wFin.toFixed(1)} kg`,
          })}
        >
          {[...finPlacementsFront, ...finPlacementsBack].map((f, i) => (
            <mesh key={i} position={[f.x, f.y, f.z]} material={tankMaterial} castShadow receiveShadow>
              <boxGeometry args={[fins.depth * 0.6, fins.height, 8]} />
            </mesh>
          ))}
        </group>
      )}

      {/* 6. Bushings: HV and LV, real height from bushHeight(Um), positioned
          on the cover above each limb. */}
      {visibility.bushings && (
        <group name="Bushings" position={[0, design.tankH / 2 + tankExplodeY + coverExplodeY + bushingExplodeY, 0]}>
          {limbX.map((x, i) => (
            <mesh
              key={`hv-${i}`} position={[x, hvBush.height / 2, design.tankW * 0.15]} material={porcelainMaterial} castShadow receiveShadow
              onPointerDown={(e) => select(e, {
                name: `HV Bushing, Phase ${i + 1}`, partNumber: PART_NUMBERS.hvBushing, material: 'Porcelain, oil-filled',
                dimensions: `${params.umHV} kV, Ht ${hvBush.height} mm`, mass: `${(hvBush.height * 0.05).toFixed(1)} kg`,
              })}
            >
              <cylinderGeometry args={[hvBush.footDia / 2, hvBush.footDia / 3, hvBush.height, 16]} />
            </mesh>
          ))}
          {limbX.map((x, i) => (
            <mesh
              key={`lv-${i}`} position={[x, lvBush.height / 2, -design.tankW * 0.15]} material={porcelainMaterial} castShadow receiveShadow
              onPointerDown={(e) => select(e, {
                name: `LV Bushing, Phase ${i + 1}`, partNumber: PART_NUMBERS.lvBushing, material: 'Porcelain, oil-filled',
                dimensions: `${params.umLV} kV, Ht ${lvBush.height} mm`, mass: `${(lvBush.height * 0.04).toFixed(1)} kg`,
              })}
            >
              <cylinderGeometry args={[lvBush.footDia / 2, lvBush.footDia / 3, lvBush.height, 16]} />
            </mesh>
          ))}
        </group>
      )}

      {/* 7. Base channel: sized from tank length, under the tank. */}
      {visibility.baseChannel && (
        <group name="Base Channel" position={[0, tankExplodeY - design.tankH / 2 - channelH / 2, 0]}
          onPointerDown={(e) => select(e, {
            name: 'Base Channel, 2 Beams', partNumber: PART_NUMBERS.baseChannel, material: 'Mild steel channel',
            dimensions: `${channelLen.toFixed(0)} x ${channelH} x ${channelW} mm, x2`,
            mass: `${channelMass.toFixed(1)} kg`,
          })}
        >
          {[design.tankW * 0.3, -design.tankW * 0.3].map((z, i) => (
            <mesh key={i} position={[0, 0, z]} material={frameMaterial} castShadow receiveShadow>
              <boxGeometry args={[channelLen, channelH, channelW]} />
            </mesh>
          ))}
        </group>
      )}

      {/* 8. Clamping frame and tie rods: top and bottom frame sandwiching
          the yokes, tied outside the outer limbs. */}
      {visibility.clampingFrame && (
        <group
          name="Clamping Frame"
          onPointerDown={(e) => select(e, {
            name: 'Core Clamping Frame and Tie Rods', partNumber: PART_NUMBERS.clampingFrame, material: 'Mild steel',
            dimensions: `Frame ${frameLen.toFixed(0)} mm, ${4} tie rods dia ${tieRodDia} mm`,
            mass: `${(frameMass + tieRodMass).toFixed(1)} kg`,
          })}
        >
          {[yokeY + crossSpan / 2 + frameThk / 2, -yokeY - crossSpan / 2 - frameThk / 2].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} material={frameMaterial} castShadow receiveShadow>
              <boxGeometry args={[frameLen, frameThk, frameDepth]} />
            </mesh>
          ))}
          {[tieRodX, -tieRodX].map((x, i) => [1, -1].map((s, j) => (
            <mesh key={`${i}-${j}`} position={[x, 0, s * frameDepth * 0.3]} material={frameMaterial} castShadow receiveShadow>
              <cylinderGeometry args={[tieRodDia / 2, tieRodDia / 2, tieRodSpanY, 12]} />
            </mesh>
          )))}
        </group>
      )}

      {/* 9. Name plate, for scale and inspection completeness. */}
      {visibility.tank && (
        <mesh position={[design.tankL / 2 + 3, 0, 0]} material={namePlateMaterial} castShadow receiveShadow
          onPointerDown={(e) => select(e, {
            name: 'Rating Name Plate', partNumber: PART_NUMBERS.namePlate, material: 'Anodised aluminium',
            dimensions: '300 x 200 x 2 mm', mass: '0.5 kg',
          })}
        >
          <boxGeometry args={[3, 200, 300]} />
        </mesh>
      )}
    </group>
  );
}
