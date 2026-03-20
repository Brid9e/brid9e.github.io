import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'

const TEXT = 'Brid9e'
const MAX_POINTS = 2600
/** 略大步长 + 略细字重，避免笔画与粒子叠成「一坨」盖住 B 的镂空 */
const SAMPLE_STEP = 3
const REPEL_RADIUS = 0.55
const REPEL_STRENGTH = 0.36
const RETURN = 0.22

/** 像素点须明显小于笔画宽，否则 B/9 的内白会被盖住 */
const DOT_SIZE_PX = 2.1
const DOT_SIZE_LIGHT_PX = 1.95

type Pt2 = { x: number; y: number }

function sampleTextPoints(
  text: string,
  canvasW: number,
  canvasH: number
): Pt2[] {
  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasW, canvasH)
  ctx.fillStyle = '#000000'
  /** 与首页 h1 的 font-semibold 一致；略小于画布高，留白边利于孔洞不被描边糊满 */
  const fontPx = Math.max(12, Math.floor(canvasH * 0.4))
  ctx.font = `600 ${fontPx}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvasW / 2, canvasH / 2)

  const img = ctx.getImageData(0, 0, canvasW, canvasH)
  const raw: Pt2[] = []
  for (let py = 0; py < canvasH; py += SAMPLE_STEP) {
    for (let px = 0; px < canvasW; px += SAMPLE_STEP) {
      const i = (py * canvasW + px) * 4
      const lum = (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3
      /** 略提高阈值，少采灰边，镂空区域更干净 */
      if (lum < 200) {
        const u = px / canvasW
        const v = py / canvasH
        const worldX = (u - 0.5) * 2
        const worldY = (0.5 - v) * 2
        raw.push({ x: worldX, y: worldY })
      }
    }
  }

  if (raw.length === 0) return raw
  if (raw.length <= MAX_POINTS) return raw
  const stride = Math.ceil(raw.length / MAX_POINTS)
  return raw.filter((_, idx) => idx % stride === 0).slice(0, MAX_POINTS)
}

type LogoBrid9eParticlesProps = {
  /** 外层 Link 的 className（如与标题同行时传 h-[1em] w-[4.75em]） */
  className?: string
  /**
   * 正交相机下「拉远」不会变小——**改 Z 距离无效**；放大等价于把视锥 left/right/top/bottom 同除以该值（画面里看到的字变大）。
   * 不改 `sampleTextPoints` 的离屏画布；粒子点径会按比例放大，避免只放大字形、点却变针尖。
   */
  viewZoom?: number
}

export default function LogoBrid9eParticles({
  className = '',
  viewZoom = 1
}: LogoBrid9eParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    let cancelled = false

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
    renderer.domElement.className = 'block h-full w-full cursor-pointer'
    el.appendChild(renderer.domElement)

    let pointCount = 0
    let positions = new Float32Array(0)
    let base = new Float32Array(0)
    const geometry = new THREE.BufferGeometry()

    const material = new THREE.PointsMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: false,
      depthTest: false,
      depthWrite: false,
      size: DOT_SIZE_PX
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    const mouse = { x: 0, y: 0, active: false }

    const zoom = Math.max(0.25, Math.min(viewZoom, 12))

    const syncThemeAndPointSize = () => {
      const dark = document.documentElement.classList.contains('dark')
      material.color.setHex(dark ? 0xeeeeee : 0x222222)
      material.opacity = dark ? 0.96 : 0.92
      const pr = renderer.getPixelRatio()
      /** 与 Three 内部对 gl_PointSize 的处理配合，避免再乘 pr 导致点过大 */
      material.size =
        (dark ? DOT_SIZE_PX : DOT_SIZE_LIGHT_PX) * Math.min(pr, 1.5) * zoom
    }

    const rebuildParticles = () => {
      const w = Math.max(1, el.clientWidth)
      const h = Math.max(1, el.clientHeight)
      const aspect = w / h
      camera.left = -aspect / zoom
      camera.right = aspect / zoom
      camera.top = 1 / zoom
      camera.bottom = -1 / zoom
      camera.updateProjectionMatrix()

      syncThemeAndPointSize()

      let pts = sampleTextPoints(TEXT, 960, 224)
      if (pts.length === 0) {
        pts = [{ x: 0, y: 0 }]
      }

      pointCount = pts.length
      positions = new Float32Array(pointCount * 3)
      base = new Float32Array(pointCount * 3)
      const scale = 0.92
      for (let i = 0; i < pointCount; i++) {
        const x = pts[i].x * aspect * scale
        const y = pts[i].y * scale
        base[i * 3] = x
        base[i * 3 + 1] = y
        base[i * 3 + 2] = 0
        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = 0
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.attributes.position.needsUpdate = true
    }

    const setSize = () => {
      const w = Math.max(1, el.clientWidth)
      const h = Math.max(1, el.clientHeight)
      renderer.setSize(w, h, false)
      rebuildParticles()
    }

    const obs = new MutationObserver(() => {
      if (cancelled) return
      syncThemeAndPointSize()
    })
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    const ro = new ResizeObserver(() => {
      if (cancelled) return
      setSize()
    })
    ro.observe(el)

    setSize()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return
        setSize()
      })
    })

    const onWinResize = () => {
      if (cancelled) return
      setSize()
    }
    window.addEventListener('resize', onWinResize)

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      mouse.active = inside
      if (!inside) return
      const nx = (e.clientX - rect.left) / rect.width
      const ny = (e.clientY - rect.top) / rect.height
      mouse.x = camera.left + nx * (camera.right - camera.left)
      mouse.y = camera.top - ny * (camera.top - camera.bottom)
    }

    const onLeave = () => {
      mouse.active = false
    }

    el.addEventListener('mousemove', onMove, { passive: true })
    el.addEventListener('mouseleave', onLeave)

    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      if (pointCount === 0) {
        renderer.render(scene, camera)
        return
      }

      const pos = geometry.attributes.position.array as Float32Array
      const blend = mouse.active ? 1 : 0

      for (let i = 0; i < pointCount; i++) {
        const ix = i * 3
        const bx = base[ix]
        const by = base[ix + 1]
        const bz = base[ix + 2]

        let tx = bx
        let ty = by
        const tz = bz

        if (blend > 0.02) {
          const dx = bx - mouse.x
          const dy = by - mouse.y
          const dist = Math.hypot(dx, dy)
          if (dist > 1e-4 && dist < REPEL_RADIUS) {
            const t = 1 - dist / REPEL_RADIUS
            const push = t * t * REPEL_STRENGTH
            tx += (dx / dist) * push
            ty += (dy / dist) * push
          }
        }

        pos[ix] += (tx - pos[ix]) * RETURN
        pos[ix + 1] += (ty - pos[ix + 1]) * RETURN
        pos[ix + 2] += (tz - pos[ix + 2]) * RETURN
      }

      geometry.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      obs.disconnect()
      ro.disconnect()
      window.removeEventListener('resize', onWinResize)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement)
      }
    }
  }, [viewZoom])

  return (
    <Link
      to="/"
      className={`relative z-10 inline-flex h-full w-full cursor-pointer ${className}`.trim()}
      aria-label="Brid9e 首页"
      title="首页">
      <div ref={containerRef} className="h-full w-full" />
    </Link>
  )
}
