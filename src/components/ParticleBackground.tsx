import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/** 相邻矩阵点在屏幕上的间距（CSS 像素），缩放窗口时保持不变 */
const GAP_PX = 24
/** 点的视觉直径（像素）近似，随 worldPerPx 换算 */
const DOT_SIZE_PX = 4
/** 浅色模式下略大，更易辨认 */
const DOT_SIZE_LIGHT_PX = 5
/** 鼠标影响半径（像素）近似 */
const INFLUENCE_PX = 120

const WAVE_AMP = 0.055
const RETURN = 0.14

function buildGrid(
  cols: number,
  rows: number,
  left: number,
  right: number,
  bottom: number,
  top: number,
  base: Float32Array,
  positions: Float32Array
) {
  let i = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const u = cols > 1 ? col / (cols - 1) : 0
      const v = rows > 1 ? row / (rows - 1) : 0
      const x = left + u * (right - left)
      const y = bottom + v * (top - bottom)
      base[i] = x
      base[i + 1] = y
      base[i + 2] = 0
      positions[i] = x
      positions[i + 1] = y
      positions[i + 2] = 0
      i += 3
    }
  }
}

export default function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.z = 1

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.className =
      'absolute inset-0 w-full h-full pointer-events-none'
    el.appendChild(renderer.domElement)

    let cols = 2
    let rows = 2
    let pointCount = 4
    let positions = new Float32Array(pointCount * 3)
    let base = new Float32Array(pointCount * 3)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      size: 0.016,
      color: 0x888888,
      transparent: true,
      opacity: 0.38,
      sizeAttenuation: true,
      depthWrite: false
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    const mouse = { x: 0, y: 0, inside: false }
    let mouseBlend = 0
    let time = 0
    /** 鼠标影响半径（世界单位），随窗口变化使屏幕上的像素半径近似恒定 */
    let influenceWorld = 0.38

    const syncTheme = () => {
      const dark = document.documentElement.classList.contains('dark')
      // 浅色背景需更深、更不透明，点才看得清
      material.color.setHex(dark ? 0x8a8a8a : 0x3a3a3a)
      material.opacity = dark ? 0.34 : 0.58
      const w = Math.max(1, el.clientWidth || window.innerWidth)
      const h = Math.max(1, el.clientHeight || window.innerHeight)
      const worldW = camera.right - camera.left
      const worldH = camera.top - camera.bottom
      const worldPerPx = (worldW / w + worldH / h) / 2
      material.size = (dark ? DOT_SIZE_PX : DOT_SIZE_LIGHT_PX) * worldPerPx
    }
    syncTheme()

    const obs = new MutationObserver(syncTheme)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    const setSize = () => {
      const w = Math.max(1, el.clientWidth || window.innerWidth)
      const h = Math.max(1, el.clientHeight || window.innerHeight)
      const aspect = w / h

      camera.left = -aspect
      camera.right = aspect
      camera.top = 1
      camera.bottom = -1
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)

      const worldW = camera.right - camera.left
      const worldH = camera.top - camera.bottom
      const worldPerPxX = worldW / w
      const worldPerPxY = worldH / h
      const worldPerPx = (worldPerPxX + worldPerPxY) / 2

      const dark = document.documentElement.classList.contains('dark')
      material.size = (dark ? DOT_SIZE_PX : DOT_SIZE_LIGHT_PX) * worldPerPx
      influenceWorld = INFLUENCE_PX * worldPerPx

      const newCols = Math.max(2, Math.floor(w / GAP_PX) + 1)
      const newRows = Math.max(2, Math.floor(h / GAP_PX) + 1)
      const newCount = newCols * newRows

      if (newCount !== pointCount) {
        pointCount = newCount
        cols = newCols
        rows = newRows
        positions = new Float32Array(pointCount * 3)
        base = new Float32Array(pointCount * 3)
        geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(positions, 3)
        )
      } else {
        cols = newCols
        rows = newRows
      }

      buildGrid(
        cols,
        rows,
        camera.left,
        camera.right,
        camera.bottom,
        camera.top,
        base,
        positions
      )
      geometry.attributes.position.needsUpdate = true
    }

    setSize()

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const inX = e.clientX >= rect.left && e.clientX <= rect.right
      const inY = e.clientY >= rect.top && e.clientY <= rect.bottom
      mouse.inside = inX && inY
      if (!mouse.inside) return
      const nx = (e.clientX - rect.left) / rect.width
      const ny = (e.clientY - rect.top) / rect.height
      mouse.x = camera.left + nx * (camera.right - camera.left)
      mouse.y = camera.top - ny * (camera.top - camera.bottom)
    }

    const onLeave = () => {
      mouse.inside = false
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    el.addEventListener('mouseleave', onLeave)

    const onResize = () => setSize()
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      time += 0.016
      mouseBlend = THREE.MathUtils.lerp(
        mouseBlend,
        mouse.inside ? 1 : 0,
        mouse.inside ? 0.18 : 0.06
      )

      const pos = geometry.attributes.position.array as Float32Array
      const infSq = influenceWorld * influenceWorld
      for (let i = 0; i < pointCount; i++) {
        const ix = i * 3
        const bx = base[ix]
        const by = base[ix + 1]
        const bz = base[ix + 2]

        const dx = bx - mouse.x
        const dy = by - mouse.y
        const dist = Math.hypot(dx, dy)
        const distSq = dx * dx + dy * dy
        const falloff = Math.exp(-distSq / infSq) * mouseBlend
        const wave = Math.sin(dist * 14 - time * 2.4) * WAVE_AMP * falloff
        const tx = bx + (dx / (dist + 1e-5)) * wave * 0.35
        const ty = by + (dy / (dist + 1e-5)) * wave * 0.35
        const tz = bz + wave

        pos[ix] += (tx - pos[ix]) * RETURN
        pos[ix + 1] += (ty - pos[ix + 1]) * RETURN
        pos[ix + 2] += (tz - pos[ix + 2]) * RETURN
      }
      geometry.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      obs.disconnect()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      el.removeEventListener('mouseleave', onLeave)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden
    />
  )
}
