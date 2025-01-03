import { useEffect, useRef, useState } from 'react'
import { useMouse } from 'ahooks'
import { useLocation } from 'react-router-dom'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { createNoise4D } from 'simplex-noise'
import { Vector3, Color } from 'three'
import type { DirectionalLight } from 'three'
import BellamyStevenson from '@/assets/fonts/Bellamy-Stevenson.otf'
import gsap from 'gsap'
import styles from './index.module.scss'

const LightSource = ({ primaryColor }: { primaryColor: string }) => {
  const location = useLocation()
  const [color, setColor] = useState<string>(primaryColor)

  useEffect(() => {
    switch (location.pathname) {
      case '/me':
        setColor('#33d9b2')
        break
      case '/projects':
        setColor('#8c7ae6')
        break
      case '/talks':
        setColor('#ffb142')
        break
      case '/':
        setColor(primaryColor)
        break
      default:
        break
    }
  }, [location])

  const lightRef = useRef<DirectionalLight>(null)
  const { clientX, clientY } = useMouse()

  // 根据鼠标位置更新光源的位置
  useFrame(() => {
    if (lightRef.current && window.innerWidth >= 1024) {
      lightRef.current.position.x = (clientX / window.innerWidth) * 2 - 1 || 0
      lightRef.current.position.y = -(clientY / window.innerHeight) * 2 + 1 || 0
      lightRef.current.position.z = 0.8 // 固定 z 位置
    }
  })

  useEffect(() => {
    if (lightRef.current) {
      const currentColor = lightRef.current.color
      const targetColor = new Color(color)
      gsap.to(currentColor, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 2 // 动画持续时间
      })
    }
  }, [color])

  return (
    <directionalLight
      ref={lightRef}
      intensity={1}
      color={color}
      position={[0, 0, 1]} // 初始位置
    />
  )
}

function RotatingCube({ primaryColor }: { primaryColor?: string }) {
  const noise4D = createNoise4D()
  const meshRef = useRef<any>()

  useEffect(() => {
    const geometry = meshRef.current.geometry
    const positions = geometry.attributes.position.array

    // 计算法线（从原点到顶点的方向）
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]

      // 归一化向量（即法线），假设球体半径为1
      const length = Math.sqrt(x * x + y * y + z * z)
      positions[i] /= length
      positions[i + 1] /= length
      positions[i + 2] /= length
    }

    geometry.computeVertexNormals() // 确保法线正确计算
    geometry.attributes.normal.needsUpdate = true
  }, [])

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // meshRef.current.rotation.x = clock.getElapsedTime() * 0.5
      // meshRef.current.rotation.y = clock.getElapsedTime() * 0.5
      const time = clock.getElapsedTime()
      const geometry = meshRef.current.geometry
      const positions = geometry.attributes.position.array
      const normals = geometry.attributes.normal.array
      const originalRadius = 1 // 假设球体原始半径为1

      // 使用4D噪声函数更新每个顶点的径向距离
      for (let i = 0; i < positions.length; i += 3) {
        const nx = normals[i]
        const ny = normals[i + 1]
        const nz = normals[i + 2]

        // 增加空间频率和时间影响，以及输出高度的放大倍数
        const frequency = 4 // 调整此值改变细节度
        const amplitude = 0.16 // 放大输出高度
        const speed = 1 // 时间变化速度

        // 利用时间作为第四个维度，创造动画效果
        const noiseValue = noise4D(
          nx * frequency,
          ny * frequency,
          nz * frequency,
          time * speed
        )
        const newRadius = originalRadius + noiseValue * amplitude

        // 根据新的半径调整顶点的位置
        positions[i] = nx * newRadius
        positions[i + 1] = ny * newRadius
        positions[i + 2] = nz * newRadius
      }
      geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <>
      <mesh ref={meshRef} position={[0, 0, 2]}>
        {/* <icosahedronGeometry args={[1, 0]} /> */}
        <sphereGeometry args={[2, 128, 128]} />
        <meshPhongMaterial opacity={1} wireframe={false} />
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
      <LightSource primaryColor={primaryColor} />
      <RotatingCube primaryColor={primaryColor} />
      <Text
        position={[0, -0.2, 3.5]}
        font={BellamyStevenson}
        fontSize={
          window.innerWidth <= 768
            ? window.innerWidth * 0.00032
            : (window.innerWidth > 1280 ? 1280 : window.innerWidth) * 0.00022
        }
        fontWeight={600}
        color="#ffffff">
        {'Love life, love yourself.'}
        <meshMatcapMaterial color="#ffffff" />
      </Text>
    </Canvas>
  )
}

export default ThreeModel
