import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Sphere,
  MeshDistortMaterial,
  Float,
  Points,
  PointMaterial,
} from '@react-three/drei'
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────────
// Floating Cinematic Orbs
// ─────────────────────────────────────────────────────────────────────────────

function FloatingOrbs() {
  const orbs = useMemo(
    () => [
      {
        position: [2.5, 1.5, -2],
        scale: 1.2,
        color: '#BA1A6A',
        speed: 1.5,
        distort: 0.3,
        floatIntensity: 1.5,
      },
      {
        position: [-2, -1, -1.5],
        scale: 0.8,
        color: '#8B004A',
        speed: 2.0,
        distort: 0.4,
        floatIntensity: 2,
      },

      {
        position: [-3.5, 2, -5],
        scale: 2.2,
        color: '#BA1A6A',
        speed: 1.2,
        distort: 0.2,
        floatIntensity: 1,
      },
      {
        position: [3, -2.5, -6],
        scale: 1.8,
        color: '#8B004A',
        speed: 1.8,
        distort: 0.3,
        floatIntensity: 1.5,
      },

      {
        position: [0, 0, -10],
        scale: 4.0,
        color: '#BA1A6A',
        speed: 0.8,
        distort: 0.1,
        floatIntensity: 0.5,
      },
      {
        position: [-5, -4, -12],
        scale: 3.0,
        color: '#F2EFE7',
        speed: 1.0,
        distort: 0.15,
        floatIntensity: 0.8,
      },
      {
        position: [5, 4, -15],
        scale: 5.0,
        color: '#8B004A',
        speed: 0.5,
        distort: 0.1,
        floatIntensity: 0.5,
      },
    ],
    []
  )

  return (
    <group>
      {orbs.map((orb, i) => (
        <Float
          key={i}
          speed={orb.speed}
          rotationIntensity={0.5}
          floatIntensity={orb.floatIntensity}
          position={orb.position as any}
        >
          <Sphere args={[1, 64, 64]} scale={orb.scale}>
            <MeshDistortMaterial
              color={orb.color}
              distort={orb.distort}
              speed={orb.speed * 2}
              roughness={0.2}
              metalness={0.8}
              transparent
              opacity={0.6}
              transmission={0.9}
              thickness={1.5}
            />
          </Sphere>
        </Float>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Scene Wrapper
// ─────────────────────────────────────────────────────────────────────────────

function InteractiveScene() {
  const groupRef = useRef<THREE.Group>(null)
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener('mousemove', handleMouseMove, {
      passive: true,
    })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  useFrame(() => {
    if (groupRef.current) {
      const targetRotationY = mouse.current.x * 0.4
      const targetRotationX = mouse.current.y * 0.4

      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotationY,
        0.03
      )

      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotationX,
        0.03
      )

      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        mouse.current.x * 2,
        0.03
      )

      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        mouse.current.y * 2,
        0.03
      )
    }
  })

  return (
    <group ref={groupRef}>
      <FloatingOrbs />
      <NeuralParticles />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Neural Ambient Particles
// ─────────────────────────────────────────────────────────────────────────────

function NeuralParticles() {
  const pointsRef = useRef<THREE.Points>(null)

  const particlesCount = 300

  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount; i++) {
      const r = 4 + Math.random() * 15
      const theta = 2 * Math.PI * Math.random()
      const phi = Math.acos(2 * Math.random() - 1)

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi) - 8
    }

    return pos
  }, [])

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03
      pointsRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.05) * 0.1
    }
  })

  return (
    <Points
      ref={pointsRef}
      positions={positions}
      stride={3}
      frustumCulled={false}
    >
      <PointMaterial
        transparent
        color="#F2EFE7"
        size={0.04}
        sizeAttenuation
        depthWrite={false}
        opacity={0.15}
      />
    </Points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

export function NeuralCore() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none opacity-80"
      style={{ mixBlendMode: 'screen' }}
    >
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 45,
        }}
        dpr={[1, 2]}
      >
        {/* Lighting */}

        <ambientLight intensity={0.4} />

        <directionalLight
          position={[5, 5, 5]}
          intensity={1.5}
          color="#BA1A6A"
        />

        <directionalLight
          position={[-5, -5, 2]}
          intensity={0.8}
          color="#8B004A"
        />

        <directionalLight
          position={[0, -5, -5]}
          intensity={0.4}
          color="#ffffff"
        />

        {/* Scene */}

        <InteractiveScene />

        {/* Post Processing */}

        <EffectComposer enableNormalPass multisampling={0}>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={0.8}
            mipmapBlur
          />

          <Noise opacity={0.015} />
        </EffectComposer>
      </Canvas>

      {/* Soft Blur Overlay */}

      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backdropFilter: 'blur(100px)',
          WebkitBackdropFilter: 'blur(100px)',
        }}
      />
    </div>
  )
}