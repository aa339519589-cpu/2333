import { Html, Line, OrbitControls, PerspectiveCamera, Sparkles, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { CityBuilding, CityModel } from "../city";
import type { CityEvent, WeatherCondition } from "../simulation";

interface CitySceneProps {
  city: CityModel;
  selectedBuildingId: string | null;
  hoveredBuildingId: string | null;
  events: readonly CityEvent[];
  weather: WeatherCondition;
  dayMode: "day" | "night" | "auto";
  autoCruise: boolean;
  firstPerson: boolean;
  showTraffic: boolean;
  showDistricts: boolean;
  showEvents: boolean;
  onSelectBuilding: (id: string) => void;
  onHoverBuilding: (id: string | null) => void;
  onPerformance: (drawCalls: number, triangles: number) => void;
}

const buildingColor = (kind: CityBuilding["kind"]): THREE.Color => new THREE.Color({
  residential: "#335a58",
  commercial: "#456c73",
  industrial: "#655947",
  hospital: "#7a5a58",
  energy: "#6e6540",
  communications: "#536581",
  civic: "#5a6a64",
}[kind]);

function Buildings({ city, selectedBuildingId, hoveredBuildingId, onSelectBuilding, onHoverBuilding }: Pick<CitySceneProps, "city" | "selectedBuildingId" | "hoveredBuildingId" | "onSelectBuilding" | "onHoverBuilding">) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (mesh === null) return;
    city.buildings.forEach((building, index) => {
      dummy.position.set(...building.position);
      dummy.rotation.set(0, building.rotation, 0);
      dummy.scale.set(...building.size);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      const active = building.id === selectedBuildingId;
      const hovered = building.id === hoveredBuildingId;
      color.copy(active ? new THREE.Color("#e9c36b") : hovered ? new THREE.Color("#7ff7df") : buildingColor(building.kind));
      mesh.setColorAt(index, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor !== null) mesh.instanceColor.needsUpdate = true;
  }, [city.buildings, color, dummy, hoveredBuildingId, selectedBuildingId]);

  const buildingFromInstance = (instanceId: number | undefined): CityBuilding | undefined => {
    if (instanceId === undefined) return undefined;
    return city.buildings[instanceId];
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, city.buildings.length]}
      castShadow
      receiveShadow
      onClick={(event) => { event.stopPropagation(); const building = buildingFromInstance(event.instanceId); if (building !== undefined) onSelectBuilding(building.id); }}
      onPointerMove={(event) => { event.stopPropagation(); onHoverBuilding(buildingFromInstance(event.instanceId)?.id ?? null); document.body.style.cursor = "crosshair"; }}
      onPointerOut={() => { onHoverBuilding(null); document.body.style.cursor = "default"; }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.72} metalness={0.45} emissive="#142523" emissiveIntensity={0.25} />
    </instancedMesh>
  );
}

function Traffic({ enabled }: { enabled: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current !== null) group.current.rotation.y = state.clock.elapsedTime * 0.03;
  });
  if (!enabled) return null;
  return (
    <group ref={group}>
      {Array.from({ length: 28 }, (_, index) => {
        const angle = (index / 28) * Math.PI * 2;
        const radius = 16 + (index % 4) * 8;
        return (
          <mesh key={index} position={[Math.cos(angle) * radius, 0.28 + (index % 3) * 0.05, Math.sin(angle) * radius]}>
            <sphereGeometry args={[0.18, 7, 7]} />
            <meshBasicMaterial color={index % 5 === 0 ? "#e7b157" : "#62e5ca"} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function Drones() {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    const groupValue = group.current;
    if (groupValue === null) return;
    groupValue.children.forEach((child, index) => {
      const t = state.clock.elapsedTime * (0.15 + index * 0.01) + index;
      child.position.x = Math.cos(t) * (24 + index * 1.8);
      child.position.z = Math.sin(t * 0.86) * (22 + index * 1.4);
      child.position.y = 11 + Math.sin(t * 1.8) * 3 + index * 0.3;
    });
  });
  return <group ref={group}>{Array.from({ length: 8 }, (_, index) => <mesh key={index}><octahedronGeometry args={[0.34, 0]} /><meshBasicMaterial color="#8cebd8" /></mesh>)}</group>;
}

function CameraRig({ autoCruise, firstPerson }: { autoCruise: boolean; firstPerson: boolean }) {
  const { camera } = useThree();
  useFrame((state, delta) => {
    if (!autoCruise) return;
    const t = state.clock.elapsedTime * 0.06;
    const target = new THREE.Vector3(Math.cos(t) * 62, firstPerson ? 3.5 : 40, Math.sin(t) * 62);
    camera.position.lerp(target, Math.min(1, delta * 0.4));
    camera.lookAt(0, firstPerson ? 3 : 5, 0);
  });
  return null;
}

function SceneContent(props: CitySceneProps) {
  const isNight = props.dayMode === "night" || (props.dayMode === "auto" && new Date().getHours() >= 18);
  const selected = props.city.buildings.find((building) => building.id === props.selectedBuildingId);
  const activeEvents = props.events.filter((event) => event.status === "active").slice(0, 8);
  useFrame((state) => props.onPerformance(state.gl.info.render.calls, state.gl.info.render.triangles));

  return (
    <>
      <color attach="background" args={[isNight ? "#050908" : "#0a1514"]} />
      <fog attach="fog" args={[props.weather === "fog" ? "#394947" : "#0b1514", props.weather === "fog" ? 18 : 48, props.weather === "fog" ? 85 : 150]} />
      <ambientLight intensity={isNight ? 0.42 : 1.15} color="#aac9c1" />
      <directionalLight position={[35, 55, 20]} intensity={isNight ? 0.75 : 2.2} color={isNight ? "#7a9bb8" : "#d8eee7"} castShadow />
      <pointLight position={[-24, 18, -18]} intensity={isNight ? 20 : 5} distance={55} color="#58d8c3" />
      <PerspectiveCamera makeDefault position={props.firstPerson ? [0, 3.2, 34] : [56, 48, 64]} fov={props.firstPerson ? 64 : 48} />
      <OrbitControls enabled={!props.autoCruise} enableDamping dampingFactor={0.06} minDistance={props.firstPerson ? 2 : 18} maxDistance={115} maxPolarAngle={Math.PI * 0.49} target={[0, 4, 0]} />
      <CameraRig autoCruise={props.autoCruise} firstPerson={props.firstPerson} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[125, 125, 1, 1]} /><meshStandardMaterial color="#0b1312" roughness={0.95} metalness={0.15} /></mesh>
      {props.city.roads.map((road) => <Line key={road.id} points={road.points.map(([x, z]) => [x, 0.06, z] as [number, number, number])} color={road.arterial ? "#365e58" : "#253936"} lineWidth={road.arterial ? 2 : 1} transparent opacity={0.72} />)}
      {props.showDistricts && props.city.districts.map((district) => <mesh key={district.id} position={[district.center[0], 0.09, district.center[1]]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[15.5, 16, 48]} /><meshBasicMaterial color={district.color} transparent opacity={0.2} /></mesh>)}
      <Buildings {...props} />
      <Traffic enabled={props.showTraffic} />
      <Drones />
      {props.showEvents && activeEvents.map((event, index) => {
        const district = props.city.districts.find((item) => item.id === event.districtId);
        if (district === undefined) return null;
        return <group key={event.id} position={[district.center[0] + index * 0.8, 7 + index * 0.5, district.center[1]]}><mesh><sphereGeometry args={[0.6 + event.severity * 0.12, 12, 12]} /><meshBasicMaterial color={event.severity >= 4 ? "#ef725d" : "#e7b157"} transparent opacity={0.8} /></mesh><Html center distanceFactor={12}><div className="scene-event-label">S{event.severity} {event.title}</div></Html></group>;
      })}
      {selected !== undefined && <Html position={[selected.position[0], selected.position[1] + selected.size[1] / 2 + 2, selected.position[2]]} center distanceFactor={11}><div className="scene-building-label"><strong>{selected.name}</strong><span>{selected.kind.toUpperCase()} / {selected.id}</span></div></Html>}
      {(props.weather === "rain" || props.weather === "storm") && <Sparkles count={props.weather === "storm" ? 900 : 500} scale={[110, 48, 110]} size={0.55} speed={3} color="#7bb0b7" />}
      {isNight && <Stars radius={140} depth={35} count={1200} factor={2} saturation={0} fade speed={0.2} />}
    </>
  );
}

function CitySceneComponent(props: CitySceneProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="scene-fallback"><strong>3D scene unavailable</strong><span>WebGL context could not be created. Operational panels remain active.</span><button type="button" onClick={() => setFailed(false)}>Retry renderer</button></div>;
  return (
    <div className="scene-canvas" data-testid="city-scene">
      <Canvas dpr={[1, 1.6]} shadows gl={{ antialias: true, powerPreference: "high-performance" }} onCreated={({ gl }) => gl.domElement.addEventListener("webglcontextlost", () => setFailed(true), { once: true })}>
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
}

export default memo(CitySceneComponent);
