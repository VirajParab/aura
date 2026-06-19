import type { VRM } from "@pixiv/three-vrm";
import type { VRMPose } from "@pixiv/three-vrm-core";
import * as THREE from "three";

const _euler = new THREE.Euler();
const _quat = new THREE.Quaternion();

function quatFromEuler(x: number, y: number, z: number): [number, number, number, number] {
  _euler.set(x, y, z);
  _quat.setFromEuler(_euler);
  return [_quat.x, _quat.y, _quat.z, _quat.w];
}

export function applyProceduralLocomotion(
  vrm: VRM,
  timeSec: number,
  mode: "walk" | "run",
): void {
  const freq = mode === "run" ? 12 : 7;
  const legAmp = mode === "run" ? 0.55 : 0.4;
  const armAmp = mode === "run" ? 0.35 : 0.25;
  const phase = timeSec * freq;
  const sinL = Math.sin(phase);
  const sinR = Math.sin(phase + Math.PI);

  const pose: VRMPose = {
    leftUpperLeg: { rotation: quatFromEuler(sinL * legAmp, 0, 0) },
    rightUpperLeg: { rotation: quatFromEuler(sinR * legAmp, 0, 0) },
    leftLowerLeg: { rotation: quatFromEuler(Math.max(0, -sinL) * legAmp * 0.8, 0, 0) },
    rightLowerLeg: { rotation: quatFromEuler(Math.max(0, -sinR) * legAmp * 0.8, 0, 0) },
    leftUpperArm: { rotation: quatFromEuler(sinR * armAmp, 0, 0.12) },
    rightUpperArm: { rotation: quatFromEuler(sinL * armAmp, 0, -0.12) },
    spine: { rotation: quatFromEuler(Math.sin(phase * 2) * 0.04, 0, 0) },
  };

  vrm.humanoid.setNormalizedPose(pose);
}

export function clearProceduralLocomotion(vrm: VRM): void {
  vrm.humanoid.resetNormalizedPose();
}
