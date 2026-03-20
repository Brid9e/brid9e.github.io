import { Icon } from '@iconify/react'
import { useLayoutEffect, useRef } from 'react'

const ICON = 'line-md:sunny-filled-loop-to-moon-filled-transition' as const

/** SMIL 时间轴上月亮态稳定后的秒数（与 sunny-filled→moon 过渡总长一致） */
const MOON_FRAME_TIME_SEC = 1.28

/** 正放 / 倒放时长（与图标内主要片段 0.4s 量级接近，略拉长更易看清） */
const TRANSITION_MS = 420

type Theme = 'light' | 'dark'

function timeForTheme(t: Theme): number {
  return t === 'light' ? 0 : MOON_FRAME_TIME_SEC
}

function freezeSvgTime(svg: SVGSVGElement, theme: Theme) {
  svg.pauseAnimations()
  svg.setCurrentTime(timeForTheme(theme))
}

function animateSvgTime(
  svg: SVGSVGElement,
  from: number,
  to: number,
  durationMs: number,
  shouldCancel: () => boolean,
  onComplete: () => void
) {
  const start = performance.now()
  const step = (now: number) => {
    if (shouldCancel()) return
    const elapsed = now - start
    const u = Math.min(1, elapsed / durationMs)
    const time = from + (to - from) * u
    try {
      svg.pauseAnimations()
      svg.setCurrentTime(time)
    } catch {
      /* ignore */
    }
    if (u < 1) {
      requestAnimationFrame(step)
    } else {
      try {
        svg.pauseAnimations()
        svg.setCurrentTime(to)
      } catch {
        /* ignore */
      }
      if (!shouldCancel()) onComplete()
    }
  }
  requestAnimationFrame(step)
}

/**
 * line-md 日→月过渡图标：切到深色时时间轴正放（0→月亮），切回浅色时倒放（月亮→0）。
 */
export default function ThemeToggleLineMdIcon({ theme }: { theme: Theme }) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  /** 上一次已对齐到主题的时间轴状态（首帧为 null，仅首次冻结） */
  const settledThemeRef = useRef<Theme | null>(null)
  const animTokenRef = useRef(0)

  useLayoutEffect(() => {
    let cancelled = false
    let frames = 0
    const maxFrames = 90
    /** 避免 rAF 与 timeout 各成功一次时 handleSvg 跑两次 */
    let applied = false

    const handleSvg = (svg: SVGSVGElement) => {
      const settled = settledThemeRef.current
      if (settled === null) {
        freezeSvgTime(svg, theme)
        settledThemeRef.current = theme
        return
      }
      if (settled === theme) {
        freezeSvgTime(svg, theme)
        return
      }

      const from = timeForTheme(settled)
      const to = timeForTheme(theme)
      const token = ++animTokenRef.current

      animateSvgTime(
        svg,
        from,
        to,
        TRANSITION_MS,
        () => cancelled || token !== animTokenRef.current,
        () => {
          settledThemeRef.current = theme
        }
      )
    }

    const tryApply = (): boolean => {
      const svg = wrapRef.current?.querySelector('svg')
      if (!svg) return false
      if (applied) return true
      applied = true
      handleSvg(svg)
      return true
    }

    const tick = () => {
      if (cancelled) return
      if (tryApply()) return
      frames += 1
      if (frames < maxFrames) requestAnimationFrame(tick)
    }

    tick()
    const t = window.setTimeout(() => {
      if (!cancelled) tryApply()
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [theme])

  return (
    <span
      ref={wrapRef}
      className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center [&_svg]:block [&_svg]:h-full [&_svg]:w-full">
      <Icon icon={ICON} className="w-full h-full" aria-hidden />
    </span>
  )
}
