import React from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { TextureLoader } from 'three'
import BellamyStevenson from '@/assets/fonts/Bellamy-Stevenson.otf'

import styles from './index.module.scss'

function RotatingCube({ primaryColor }: { primaryColor: string }) {
  const meshRef = React.useRef<any>()

  const matcapTexture = useLoader(
    TextureLoader,
    '/images/matcap-porcelain-white.jpg'
  )

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
      meshRef.current.rotation.x += 0.01
    }
  })

  return (
    <>
      <mesh ref={meshRef}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshMatcapMaterial
          color="#ffffff"
          matcap={matcapTexture}
          transparent={true}
          opacity={0.3}
        />
      </mesh>
    </>
  )
}

function ThreeModel() {
  const primaryColor = getComputedStyle(
    document.documentElement
  ).getPropertyValue('--color-primary')

  return (
    <Canvas>
      <RotatingCube primaryColor={primaryColor} />
      {
        // 移动端
        window.innerWidth <= 768 ? (
          <Text
            position={[0, 0, 2]}
            font={BellamyStevenson}
            fontSize={0.3}
            fontWeight={600}
            color="#ffffff">
            {'Love life, love yourself.'}
            <meshMatcapMaterial color="#cccccc" />
          </Text>
        ) : (
          <Text
            position={[0, 0, 2]}
            font={BellamyStevenson}
            fontSize={0.4}
            fontWeight={600}
            color="#ffffff">
            {'Love life, love yourself.'}
            <meshMatcapMaterial color="#cccccc" />
          </Text>
        )
      }

      {/* <OrbitControls enableZoom={false}></OrbitControls> */}
    </Canvas>
  )
}

export default ThreeModel
