'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VIEW_3D } from '../../lib/terrain3d';

const ROUTE_LIFT_M = 3; // keeps the route line just above the ground
const ROUTE_RADIUS_M = 4;
const STOP_RADIUS_M = 14;

// Builds the scene inside the element. Returns how to change the height stretch and how to remove it all.
function createScene(element) {
  const { rows, cols, eastStepM, southStepM, noHeight, heights, photo, route, stops } = VIEW_3D;
  const widthM = cols * eastStepM;
  const depthM = rows * southStepM;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#111');
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  element.append(renderer.domElement);

  const decoded = new Int16Array(Uint8Array.from(atob(heights), c => c.charCodeAt(0)).buffer);
  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  decoded.forEach((height, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    positions.set([(col + 0.5) * eastStepM, height === noHeight ? 0 : height / 10, (row + 0.5) * southStepM], i * 3);
    uvs.set([(col + 0.5) / cols, 1 - (row + 0.5) / rows], i * 2);
  });

  // Only squares with all four heights are drawn, so missing data stays a gap, not a false cliff.
  const triangles = [];
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const corners = [row * cols + col, row * cols + col + 1, (row + 1) * cols + col, (row + 1) * cols + col + 1];
      if (corners.some(corner => decoded[corner] === noHeight)) continue;
      triangles.push(corners[0], corners[2], corners[1], corners[1], corners[2], corners[3]);
    }
  }

  const ground = new THREE.BufferGeometry();
  ground.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  ground.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  ground.setIndex(triangles);

  let removed = false;
  function render() {
    if (!removed) renderer.render(scene, camera);
  }

  const texture = new THREE.TextureLoader().load(photo, render);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  // Everything in this group stretches together with the height slider.
  const terrain = new THREE.Group();
  terrain.position.set(-widthM / 2, 0, -depthM / 2);
  scene.add(terrain);
  terrain.add(new THREE.Mesh(ground, new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })));

  // The route and stops aren't stretched, only moved, so they keep their size and shape.
  const markers = new THREE.Group();
  markers.position.copy(terrain.position);
  scene.add(markers);

  // Drawn last and through the ground, so hills never hide part of the route.
  const routeLine = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({ color: '#00c8ff', depthTest: false, transparent: true })
  );
  routeLine.renderOrder = 1;
  markers.add(routeLine);

  const stopMarkers = stops.map(() => {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(STOP_RADIUS_M, 20, 14),
      new THREE.MeshBasicMaterial({ color: '#ffe600', depthTest: false, transparent: true })
    );
    marker.renderOrder = 2;
    markers.add(marker);
    return marker;
  });

  const camera = new THREE.PerspectiveCamera(50, 1, 1, 20000);
  camera.position.set(0, Math.max(widthM, depthM) * 0.6, depthM * 0.9);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.addEventListener('change', render);

  function applyStretch(stretch) {
    terrain.scale.y = stretch;
    const points = route.map(([x, y, z]) => new THREE.Vector3(x, y * stretch + ROUTE_LIFT_M, z));
    routeLine.geometry.dispose();
    routeLine.geometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0), points.length * 2, ROUTE_RADIUS_M, 6
    );
    stops.forEach(([x, y, z], i) => stopMarkers[i].position.set(x, y * stretch + STOP_RADIUS_M, z));
    render();
  }

  function fitWindow() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
  }
  window.addEventListener('resize', fitWindow);
  fitWindow();

  return {
    applyStretch,
    remove() {
      removed = true;
      window.removeEventListener('resize', fitWindow);
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}

export default function View3D() {
  const element = useRef(null);
  const view = useRef(null);
  const [stretch, setStretch] = useState(2);

  useEffect(() => {
    view.current = createScene(element.current);
    return () => view.current.remove();
  }, []);

  // Declared after the effect above, so the scene already exists on the first run.
  useEffect(() => {
    view.current.applyStretch(stretch);
  }, [stretch]);

  return (
    <>
      <div ref={element} />
      <div className="panel">
        <h1>Marswalk in 3D</h1>
        <span className="line"></span>Marswalk route<br />
        <span className="dot"></span>Science stop
        <label htmlFor="stretch">Height stretch: {stretch}x</label>
        <input id="stretch" type="range" min="1" max="5" step="0.5" value={stretch} onChange={e => setStretch(Number(e.target.value))} />
        <small>Drag to turn, scroll to zoom, right-drag to move. Starts looking north.</small>
        <small>Terrain and photo: HiRISE, NASA/JPL/University of Arizona.</small>
      </div>
      <Link className="view-switch" href="/">Back to the map</Link>
    </>
  );
}
