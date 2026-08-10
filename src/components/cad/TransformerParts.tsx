import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { finLayout } from '@/packages/engine';
import {
  limbSlabs, yokeSlabs, coreCrossSectionSpan, hvBushingSpec, lvBushingSpec, finPlacements,
} from './geometry';
import { computePartRecords, PartRecord } from '../../lib/partRecords';
import { parseVectorGroup, schematicPositions } from '../../lib/vectorGroup';

export interface PartInfo {
  name: string; partNumber: string; material: string; dimensions: string; mass: string;
}

/** One record's PartInfo for the group as a whole (mass = unitMass x quantity). */
function groupInfo(r: PartRecord): PartInfo {
  return {
    name: r.name, partNumber: r.partNumber, material: r.material,
    dimensions: r.quantity > 1 ? `${r.unitDimensions}, x${r.quantity}` : r.unitDimensions,
    mass: `${(r.unitMass * r.quantity).toFixed(1)} kg`,
  };
}

/** One unit out of a multi-quantity record (e.g. a single bushing out of the
 *  HV Bushings record), labelled with its own terminal marking rather than a
 *  generic "Phase N" -- so the label is right even for the neutral bushing,
 *  which is not a phase. */
function unitInfo(r: PartRecord, label: string): PartInfo {
  return {
    name: `${r.name.replace(/s?\s*\(.*\)$/, '')} ${label}`,
    partNumber: r.partNumber, material: r.material, dimensions: r.unitDimensions,
    mass: `${r.unitMass.toFixed(1)} kg`,
  };
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

export function TransformerParts({
  design, params, visibility, exploded, transparency, clippingPlanes, onSelectPart,
}: TransformerPartsProps) {
  const cc = design.cc;
  const limbX = [-cc, 0, cc];

  // The single shared source for every part's number, material, dimensions
  // and mass -- the same records the drawing-19 exploded assembly parts
  // list reads, so a part never carries two different masses in two views.
  const partRecords = useMemo(() => computePartRecords(design, params), [design, params]);
  const byKey = useMemo(() => {
    const m: Record<string, PartRecord> = {};
    partRecords.forEach((r) => { m[r.key] = r; });
    return m;
  }, [partRecords]);
  const vg = parseVectorGroup(params.vector);

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

  // Base channel and clamping frame geometry: sizes only, for the meshes
  // actually drawn below. Mass for both lives in partRecords.ts (the same
  // formulas, kept in one place so the 3D view and the parts list can never
  // disagree on either).
  const channelH = 100, channelW = 80;
  const channelLen = design.tankL * 0.95;
  const frameDepth = crossSpan * 0.5, frameThk = 40;
  const frameLen = yokeLen * 1.05;
  const tieRodDia = 22;
  const tieRodSpanY = design.coreHeight * 0.92;
  const tieRodX = cc + design.dCore / 2 + 40;

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
          onPointerDown={(e) => select(e, groupInfo(byKey.core))}
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
          onPointerDown={(e) => select(e, groupInfo(byKey.lvWinding))}
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
          onPointerDown={(e) => select(e, groupInfo(byKey.hvWinding))}
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
            onPointerDown={(e) => select(e, groupInfo(byKey.tank))}
          >
            <boxGeometry args={[design.tankL, design.tankH, design.tankW]} />
          </mesh>
          <mesh
            position={[0, design.tankH / 2 + 10 + coverExplodeY, 0]} material={tankMaterial} castShadow receiveShadow
            onPointerDown={(e) => select(e, groupInfo(byKey.tankCover))}
          >
            <boxGeometry args={[design.tankL + 20, 20, design.tankW + 20]} />
          </mesh>
        </group>
      )}

      {/* 5. Fins: real count and pitch from finLayout(), not a fixed decoration. */}
      {visibility.fins && !design.dry && (
        <group
          name="Fins" position={[0, tankExplodeY, 0]}
          onPointerDown={(e) => select(e, groupInfo(byKey.fins))}
        >
          {[...finPlacementsFront, ...finPlacementsBack].map((f, i) => (
            <mesh key={i} position={[f.x, f.y, f.z]} material={tankMaterial} castShadow receiveShadow>
              <boxGeometry args={[fins.depth * 0.6, fins.height, 8]} />
            </mesh>
          ))}
        </group>
      )}

      {/* 6. Bushings: HV and LV, real height from bushHeight(Um), positioned
          on the cover above each limb. Count follows the vector group (a
          star winding with its neutral brought out gets a fourth bushing on
          that side; a delta never does, having no star point) instead of
          always drawing three -- schematicPositions spreads that real count
          across the same span the three-phase limbs already use, so three
          bushings still land exactly on the three limbs as before. */}
      {visibility.bushings && (
        <group name="Bushings" position={[0, design.tankH / 2 + tankExplodeY + coverExplodeY + bushingExplodeY, 0]}>
          {schematicPositions(vg.hvLabels.length, 2 * cc).map((x, i) => (
            <mesh
              key={`hv-${i}`} position={[x, hvBush.height / 2, design.tankW * 0.15]} material={porcelainMaterial} castShadow receiveShadow
              onPointerDown={(e) => select(e, unitInfo(byKey.hvBushing, vg.hvLabels[i]))}
            >
              <cylinderGeometry args={[hvBush.footDia / 2, hvBush.footDia / 3, hvBush.height, 16]} />
            </mesh>
          ))}
          {schematicPositions(vg.lvLabels.length, 2 * cc).map((x, i) => (
            <mesh
              key={`lv-${i}`} position={[x, lvBush.height / 2, -design.tankW * 0.15]} material={porcelainMaterial} castShadow receiveShadow
              onPointerDown={(e) => select(e, unitInfo(byKey.lvBushing, vg.lvLabels[i]))}
            >
              <cylinderGeometry args={[lvBush.footDia / 2, lvBush.footDia / 3, lvBush.height, 16]} />
            </mesh>
          ))}
        </group>
      )}

      {/* 7. Base channel: sized from tank length, under the tank. */}
      {visibility.baseChannel && (
        <group name="Base Channel" position={[0, tankExplodeY - design.tankH / 2 - channelH / 2, 0]}
          onPointerDown={(e) => select(e, groupInfo(byKey.baseChannel))}
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
          onPointerDown={(e) => select(e, groupInfo(byKey.clampingFrame))}
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
          onPointerDown={(e) => select(e, groupInfo(byKey.namePlate))}
        >
          <boxGeometry args={[3, 200, 300]} />
        </mesh>
      )}
    </group>
  );
}
