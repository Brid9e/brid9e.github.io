import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const SPHERE_R = 0.9
/** 平面环：外径更大、内径离球更远（球半径不变） */
const RING_INNER = 1.38
const RING_OUTER = 2.08
const N_SPHERE = 5200
const N_RING = 3600
const WANDER = 0.42
const REPEL = 26
const REPEL_DIST = 0.55
const SPRING = 15
const DAMPING = 0.935
/** 深度：与摄像机距离映射到亮度 [DEPTH_BRIGHT, DEPTH_DIM]；暗色主题近亮远暗（雾感），亮色主题反转为近暗远亮以免「远的更黑」抢前景 */
const DEPTH_NEAR = 2.85
const DEPTH_FAR = 5.6
const DEPTH_BRIGHT = 1.0
const DEPTH_DIM = 0.18
/** 球+环绕行星极轴自转（环面法线 / 中轴线，非世界 Y）（弧度/秒） */
const PLANET_SPIN_SPEED = -0.38
/** 环上粒子点缀色（少量随机），与深度亮度相乘 */
const ACCENT_GREEN = { r: 0x44 / 255, g: 0xc2 / 255, b: 0x89 / 255 }
const ACCENT_PURPLE = { r: 0x79 / 255, g: 0x6d / 255, b: 0xf6 / 255 }
/** 环粒子中绿色 / 紫色占比（其余为白 + 深度） */
const ACCENT_RING_GREEN = 0.055
const ACCENT_RING_PURPLE = 0.055
/** 环绕 X 倾角：略加大可减少透视下前后环缘「叠在一起」 */
const RING_TILT = 1.4
/** 环绕 Y 略偏转一点点 */
const RING_YAW = 0.6
/** 环绕 Z 略滚转 */
const RING_ROLL = 0.1

/** 球面均匀随机分布（与环面一样「密、乱」） */
function randomUniformSphere(n: number, r: number, out: THREE.Vector3[]) {
  for (let i = 0; i < n; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const sp = Math.sin(phi)
    out.push(
      new THREE.Vector3(
        r * sp * Math.cos(theta),
        r * Math.cos(phi),
        r * sp * Math.sin(theta)
      )
    )
  }
}

function sampleRingAnnulus(
  n: number,
  rIn: number,
  rOut: number,
  out: THREE.Vector3[]
) {
  const rIn2 = rIn * rIn
  const rOut2 = rOut * rOut
  for (let i = 0; i < n; i++) {
    const theta = Math.random() * Math.PI * 2
    const u = Math.random()
    const r = Math.sqrt(u * (rOut2 - rIn2) + rIn2)
    out.push(new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), 0))
  }
}

export default function SaturnParticles() {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
    /** 经典约 45° 俯视斜视：仰角 45° + 方位 45°，对准原点 */
    const camR = 4.25
    const elev = Math.PI / 4
    const azim = Math.PI / 4
    const ch = camR * Math.cos(elev)
    camera.position.set(ch * Math.cos(azim), camR * Math.sin(elev), ch * Math.sin(azim))
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.className =
      'block w-full h-full cursor-default select-none touch-none'
    el.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.065
    controls.rotateSpeed = 0.78
    controls.enablePan = false
    controls.enableZoom = false
    controls.minDistance = 2.4
    controls.maxDistance = 14
    controls.minPolarAngle = 0.15
    controls.maxPolarAngle = Math.PI - 0.12
    controls.enabled = false

    const sphereRest: THREE.Vector3[] = []
    const ringRestLocal: THREE.Vector3[] = []
    randomUniformSphere(N_SPHERE, SPHERE_R, sphereRest)
    sampleRingAnnulus(N_RING, RING_INNER, RING_OUTER, ringRestLocal)

    const ringGroup = new THREE.Group()
    ringGroup.rotation.x = RING_TILT
    ringGroup.rotation.y = RING_YAW
    ringGroup.rotation.z = RING_ROLL

    const planetGroup = new THREE.Group()
    planetGroup.add(ringGroup)

    const sphereHit = new THREE.Mesh(
      new THREE.SphereGeometry(SPHERE_R * 1.02, 40, 40),
      new THREE.MeshBasicMaterial({ visible: false })
    )
    planetGroup.add(sphereHit)

    scene.add(planetGroup)

    /** RingGeometry 在 XY，+Z 为环法线；在 planetGroup 局部空间中固定，整星绕此轴转 */
    const planetSpinAxisLocal = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(ringGroup.quaternion)
      .normalize()

    const total = N_SPHERE + N_RING
    const positions = new Float32Array(total * 3)
    const vel: THREE.Vector3[] = []

    const restWorld = new THREE.Vector3()
    const tmp = new THREE.Vector3()
    const uDir = new THREE.Vector3()

    for (let i = 0; i < N_SPHERE; i++) {
      const o = i * 3
      positions[o] = sphereRest[i].x
      positions[o + 1] = sphereRest[i].y
      positions[o + 2] = sphereRest[i].z
      vel.push(new THREE.Vector3())
    }

    for (let i = 0; i < N_RING; i++) {
      tmp.copy(ringRestLocal[i])
      ringGroup.localToWorld(tmp)
      const o = (N_SPHERE + i) * 3
      positions[o] = tmp.x
      positions[o + 1] = tmp.y
      positions[o + 2] = tmp.z
      vel.push(new THREE.Vector3())
    }

    const accent = new Uint8Array(total)
    for (let i = N_SPHERE; i < total; i++) {
      const r = Math.random()
      if (r < ACCENT_RING_GREEN) accent[i] = 1
      else if (r < ACCENT_RING_GREEN + ACCENT_RING_PURPLE) accent[i] = 2
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const colors = new Float32Array(total * 3)
    colors.fill(1)
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.018,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true,
      vertexColors: true
    })

    const pointCloud = new THREE.Points(geometry, material)
    scene.add(pointCloud)

    const ringHit = new THREE.Mesh(
      new THREE.RingGeometry(RING_INNER * 0.99, RING_OUTER * 1.01, 96),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    )
    ringGroup.add(ringHit)

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(-99, -99)

    let themeIsDark = document.documentElement.classList.contains('dark')
    const syncTheme = () => {
      themeIsDark = document.documentElement.classList.contains('dark')
      material.color.setHex(0xffffff)
      material.opacity = themeIsDark ? 0.92 : 0.58
    }
    syncTheme()

    const obs = new MutationObserver(syncTheme)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    const p = new THREE.Vector3()
    const v = new THREE.Vector3()
    const acc = new THREE.Vector3()
    const rnd = new THREE.Vector3()
    const rep = new THREE.Vector3()
    const ringNormal = new THREE.Vector3()
    const tan = new THREE.Vector3()

    const setSize = () => {
      const w = Math.max(1, el.clientWidth)
      const h = Math.max(1, el.clientHeight)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
      const pr = renderer.getPixelRatio()
      material.size = 0.014 * pr
    }
    setSize()

    const onMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    const onLeave = () => {
      mouse.set(-99, -99)
    }

    renderer.domElement.addEventListener('pointermove', onMove, { passive: true })
    renderer.domElement.addEventListener('pointerleave', onLeave)

    const onResize = () => setSize()
    window.addEventListener('resize', onResize)

    let raf = 0
    const clock = new THREE.Clock()
    clock.getDelta()

    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)

      planetGroup.rotateOnAxis(planetSpinAxisLocal, dt * PLANET_SPIN_SPEED)
      planetGroup.updateMatrixWorld(true)
      ringNormal.setFromMatrixColumn(ringGroup.matrixWorld, 2).normalize()

      raycaster.setFromCamera(mouse, camera)
      const sphereHits = raycaster.intersectObject(sphereHit, false)
      const ringHits = raycaster.intersectObject(ringHit, false)

      const sphereHitPt =
        sphereHits.length > 0 ? sphereHits[0].point.clone() : null
      const ringHitPt =
        ringHits.length > 0 ? ringHits[0].point.clone() : null

      const pos = geometry.attributes.position.array as Float32Array

      for (let i = 0; i < N_SPHERE; i++) {
        const o = i * 3
        p.set(pos[o], pos[o + 1], pos[o + 2])
        v.copy(vel[i])
        acc.set(0, 0, 0)

        restWorld.copy(sphereRest[i]).applyMatrix4(planetGroup.matrixWorld)
        acc.add(tmp.copy(restWorld).sub(p).multiplyScalar(SPRING))

        uDir.copy(restWorld).normalize()
        rnd.set(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        )
        const along = rnd.dot(uDir)
        tan.copy(rnd).sub(tmp.copy(uDir).multiplyScalar(along))
        if (tan.lengthSq() > 1e-10) {
          tan.normalize().multiplyScalar((Math.random() - 0.5) * WANDER)
          acc.add(tan)
        }

        if (sphereHitPt) {
          const d = p.distanceTo(sphereHitPt)
          if (d < REPEL_DIST && d > 1e-8) {
            rep.copy(p).sub(sphereHitPt).normalize()
            const fall = 1 - d / REPEL_DIST
            acc.add(rep.multiplyScalar(REPEL * fall))
          }
        }
        if (ringHitPt) {
          const d = p.distanceTo(ringHitPt)
          if (d < REPEL_DIST * 1.15 && d > 1e-8) {
            rep.copy(p).sub(ringHitPt).normalize()
            const fall = 1 - d / (REPEL_DIST * 1.15)
            acc.add(rep.multiplyScalar(REPEL * fall * 0.8))
          }
        }

        v.addScaledVector(acc, dt)
        v.multiplyScalar(DAMPING)
        p.addScaledVector(v, dt)

        vel[i].copy(v)
        pos[o] = p.x
        pos[o + 1] = p.y
        pos[o + 2] = p.z
      }

      for (let i = 0; i < N_RING; i++) {
        const o = (N_SPHERE + i) * 3
        p.set(pos[o], pos[o + 1], pos[o + 2])
        v.copy(vel[N_SPHERE + i])
        acc.set(0, 0, 0)

        restWorld.copy(ringRestLocal[i])
        restWorld.applyMatrix4(ringGroup.matrixWorld)

        acc.add(tmp.copy(restWorld).sub(p).multiplyScalar(SPRING))

        tmp.copy(p).sub(restWorld)
        tan.crossVectors(ringNormal, tmp)
        if (tan.lengthSq() < 1e-10) {
          tan.crossVectors(ringNormal, new THREE.Vector3(1, 0, 0))
        }
        if (tan.lengthSq() > 1e-10) {
          tan.normalize().multiplyScalar((Math.random() - 0.5) * WANDER)
          acc.add(tan)
        }

        if (sphereHitPt) {
          const d = p.distanceTo(sphereHitPt)
          if (d < REPEL_DIST && d > 1e-8) {
            rep.copy(p).sub(sphereHitPt).normalize()
            const fall = 1 - d / REPEL_DIST
            acc.add(rep.multiplyScalar(REPEL * fall * 0.75))
          }
        }
        if (ringHitPt) {
          const d = p.distanceTo(ringHitPt)
          if (d < REPEL_DIST * 1.2 && d > 1e-8) {
            rep.copy(p).sub(ringHitPt).normalize()
            const fall = 1 - d / (REPEL_DIST * 1.2)
            acc.add(rep.multiplyScalar(REPEL * fall))
          }
        }

        v.addScaledVector(acc, dt)
        v.multiplyScalar(DAMPING)
        p.addScaledVector(v, dt)

        vel[N_SPHERE + i].copy(v)
        pos[o] = p.x
        pos[o + 1] = p.y
        pos[o + 2] = p.z
      }

      geometry.attributes.position.needsUpdate = true

      const col = geometry.attributes.color.array as Float32Array
      const cx = camera.position.x
      const cy = camera.position.y
      const cz = camera.position.z
      const invRange = 1 / Math.max(DEPTH_FAR - DEPTH_NEAR, 1e-6)
      for (let i = 0; i < total; i++) {
        const o = i * 3
        const dx = pos[o] - cx
        const dy = pos[o + 1] - cy
        const dz = pos[o + 2] - cz
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
        const t = THREE.MathUtils.clamp((d - DEPTH_NEAR) * invRange, 0, 1)
        const b = themeIsDark
          ? THREE.MathUtils.lerp(DEPTH_BRIGHT, DEPTH_DIM, t)
          : THREE.MathUtils.lerp(DEPTH_DIM, DEPTH_BRIGHT, t)
        const a = accent[i]
        if (a === 1) {
          col[o] = b * ACCENT_GREEN.r
          col[o + 1] = b * ACCENT_GREEN.g
          col[o + 2] = b * ACCENT_GREEN.b
        } else if (a === 2) {
          col[o] = b * ACCENT_PURPLE.r
          col[o + 1] = b * ACCENT_PURPLE.g
          col[o + 2] = b * ACCENT_PURPLE.b
        } else {
          col[o] = b
          col[o + 1] = b
          col[o + 2] = b
        }
      }
      geometry.attributes.color.needsUpdate = true

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      obs.disconnect()
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointermove', onMove)
      renderer.domElement.removeEventListener('pointerleave', onLeave)
      geometry.dispose()
      material.dispose()
      sphereHit.geometry.dispose()
      ringHit.geometry.dispose()
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className="relative z-10 mb-3 h-[min(280px,50vw)] w-full max-w-full rounded-lg"
      aria-hidden
    />
  )
}
