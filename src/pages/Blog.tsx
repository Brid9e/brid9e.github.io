import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import ParticleBackground from '@/components/ParticleBackground'
import SiteHeaderNav from '@/components/SiteHeaderNav'
import nikonSvg from '@/assets/imgs/nikon.svg'
import qiankunImg from '@/assets/imgs/qiankun.png'
import {
  BILIBILI_HANDLE,
  BILIBILI_URL,
  GITHUB_PROFILE_URL,
  HANDLE,
  NPM_HANDLE,
  NPM_PROFILE_URL,
  STEAM_PROFILE_URL
} from '@/constants/social'
import { latestDevLogs, slugFromFileName } from '@/lib/devlogDocs'

const STORAGE_KEY = 'theme'

type SkillTag = {
  label: string
  icon?: string
  imageSrc?: string
  /** 本地图标的尺寸类，默认 w-4 h-4 */
  imageClassName?: string
  /** 定色为黑的图标，暗色下反色以适配背景 */
  invertInDark?: boolean
  href?: string
  /** 横向 Iconify 图标可加宽 */
  iconClassName?: string
}

const REAL_NAME = '王栋桥'

/** 入职年份（用于工龄展示，按自然年差计算） */
const CAREER_JOIN_YEAR = 2021

function workYearsSinceJoin(joinYear: number): number {
  const y = new Date().getFullYear() - joinYear
  return Math.max(0, y)
}

/* 出生日期与年龄（备用，恢复时取消注释并写回介绍文案）
const BIRTH_DATE = '1997-10-28'

function ageFromIsoDate(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const birth = new Date(y, m - 1, d)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age -= 1
  }
  return age
}
*/

/** 主要技能（icon 与 https://icones.js.org 一致） */
const SKILL_TAGS_PRIMARY: SkillTag[] = [
  { label: 'Vue', icon: 'devicon:vuejs' },
  { label: 'Vite', icon: 'devicon:vitejs' },
  { label: 'TypeScript', icon: 'devicon:typescript' },
  { label: 'JavaScript', icon: 'devicon:javascript' }
]

/** 常用库（可视化、UI、微前端等） */
const SKILL_TAGS_LIBRARIES: SkillTag[] = [
  { label: 'ECharts', icon: 'simple-icons:apacheecharts' },
  { label: 'Three.js', icon: 'devicon:threejs', invertInDark: true },
  { label: 'AntV', icon: 'simple-icons:antv' },
  { label: 'Element Plus', icon: 'ep:element-plus' },
  { label: '高德地图', icon: 'mdi:map' },
  { label: 'qiankun', imageSrc: qiankunImg }
]

/** 常用编辑器 / AI 编程工具 */
const SKILL_TAGS_TOOLS: SkillTag[] = [
  { label: 'VS Code', icon: 'devicon:vscode' },
  { label: 'Cursor', icon: 'vscode-icons:file-type-cursorrules' },
  { label: 'Claude Code', icon: 'logos:claude-icon' },
  { label: 'Codex', icon: 'simple-icons:openai' }
]

/** 次要技能 */
const SKILL_TAGS_SECONDARY: SkillTag[] = [
  { label: 'Python', icon: 'devicon:python' },
  { label: 'Linux', icon: 'devicon:linux' },
  { label: 'Nginx', icon: 'logos:nginx' },
  { label: 'Docker', icon: 'logos:docker-icon' }
]

/** 与工作无关的小兴趣 */
const SKILL_TAGS_MISC: SkillTag[] = [
  {
    label: '摄影',
    imageSrc: nikonSvg,
    href: 'https://joe-photography.lofter.com/'
  },
  { label: '唱歌', icon: 'solar:music-note-bold' },
  { label: '旅游', icon: 'emojione-monotone:mountain' },
  { label: '健身（才起步，任重道远）', icon: 'icon-park-outline:fitness' },
  { label: 'CS2', icon: 'simple-icons:counterstrike' }
]

type Theme = 'light' | 'dark'

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'dark' || v === 'light') return v
  } catch {
    /* ignore */
  }
  return 'light'
}

/** 介绍中强调用语（与主标题同色：浅 #000 / 深 #fff） */
const introHlClass = 'font-medium text-[#000000] dark:text-[#ffffff]'

/** 技能行标题：四字等宽列，右侧 tag 起点对齐；略加上边距与 chip 第一行齐平 */
const skillHeadingClass =
  'shrink-0 w-[4em] pt-1 text-left text-[15px] font-normal leading-none text-[var(--fg)]'

/** 与 body line-height 一致，避免 leading-none 把标签压扁；与标题对齐靠 skillHeadingClass 的 pt */
const chipBaseClass =
  'inline-flex items-center gap-1 rounded-md bg-zinc-100 py-0.5 pl-1.5 pr-2 text-[12px] leading-[1.7] text-[var(--fg)] dark:bg-zinc-800/80'
const chipLinkClass =
  'no-underline transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700/90'

function SkillTagChips({
  tags,
  className
}: {
  tags: SkillTag[]
  className?: string
}) {
  return (
    <div
      className={['flex flex-wrap gap-[4px]', className]
        .filter(Boolean)
        .join(' ')}>
      {tags.map(
        ({
          label,
          icon,
          imageSrc,
          imageClassName,
          invertInDark,
          href,
          iconClassName
        }) => {
          const imgCn = imageClassName ?? 'h-3.5 w-3.5 object-contain shrink-0'
          const iconCn = iconClassName ?? 'h-3.5 w-3.5'
          const inner = (
            <>
              {imageSrc ? (
                <img src={imageSrc} alt="" className={imgCn} />
              ) : icon ? (
                <Icon
                  icon={icon}
                  className={`${iconCn} shrink-0${invertInDark ? 'dark:brightness-0 dark:invert' : ''}`}
                  aria-hidden
                />
              ) : null}
              {label}
            </>
          )
          return href ? (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${chipBaseClass} ${chipLinkClass}`}>
              {inner}
            </a>
          ) : (
            <span key={label} className={chipBaseClass}>
              {inner}
            </span>
          )
        }
      )}
    </div>
  )
}

export default function Blog() {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme())
  const workYears = workYearsSinceJoin(CAREER_JOIN_YEAR)
  // const age = ageFromIsoDate(BIRTH_DATE)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />
      <SiteHeaderNav
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      />

      <main className="relative z-10 px-6 pt-16 pb-20 mx-auto max-w-2xl sm:pt-20">
        <div className="flex flex-col items-start w-full">
          {/* Brid9e 粒子 Logo：恢复时 import LogoBrid9eParticles 并接在标题后 */}
          <h1 className="mt-0 text-[36px] font-semibold leading-tight tracking-tight text-[#000000] dark:text-[#ffffff]">
            {REAL_NAME}
          </h1>
          <p className="mt-4 max-w-prose text-[15px] text-[var(--fg)]">
            {/* 备用：在「工程师」后接「现年 age 岁，」（需恢复上方 BIRTH_DATE / ageFromIsoDate / age） */}
            嗨！我是{REAL_NAME}，一名
            <span className={introHlClass}>前端开发工程师</span>，
            <span className={introHlClass}>{workYears} 年</span>
            工作经验。
          </p>
          <div className="flex flex-row flex-wrap gap-y-1 gap-x-5 items-center mt-4">
            <a
              href={GITHUB_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-normal text-[var(--fg)] no-underline opacity-80 transition-opacity hover:opacity-100">
              <Icon
                icon="devicon:github"
                className="w-4 h-4 shrink-0 dark:brightness-0 dark:invert"
                aria-hidden
              />
              {HANDLE}
            </a>
            <a
              href={NPM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-normal text-[var(--fg)] no-underline opacity-80 transition-opacity hover:opacity-100">
              <Icon
                icon="devicon:npm"
                className="w-4 h-4 shrink-0"
                aria-hidden
              />
              {NPM_HANDLE}
            </a>
            <a
              href={BILIBILI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-normal text-[var(--fg)] no-underline opacity-80 transition-opacity hover:opacity-100">
              <Icon
                icon="simple-icons:bilibili"
                className="h-4 w-4 shrink-0 text-[#00AEEC] dark:text-[#23ADE5]"
                aria-hidden
              />
              {BILIBILI_HANDLE}
            </a>
            <a
              href={STEAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Steam 个人主页"
              className="inline-flex items-center gap-1.5 text-sm font-normal text-[var(--fg)] no-underline opacity-80 transition-opacity hover:opacity-100">
              <Icon
                icon="simple-icons:steam"
                className="w-4 h-4 shrink-0"
                aria-hidden
              />
              {HANDLE}
            </a>
          </div>

          <section
            className="mt-12 flex w-full flex-col gap-[8px]"
            aria-label="技能">
            <section
              className="flex flex-row flex-wrap gap-x-4 items-start w-full"
              aria-label="主要技能">
              <h2 className={skillHeadingClass}>主要技能</h2>
              <SkillTagChips
                tags={SKILL_TAGS_PRIMARY}
                className="flex-1 min-w-0"
              />
            </section>

            <section
              className="flex flex-row flex-wrap gap-x-4 items-start w-full"
              aria-label="次要技能">
              <h2 className={skillHeadingClass}>次要技能</h2>
              <SkillTagChips
                tags={SKILL_TAGS_SECONDARY}
                className="flex-1 min-w-0"
              />
            </section>

            <section
              className="flex flex-row flex-wrap gap-x-4 items-start w-full"
              aria-label="常用库">
              <h2 className={skillHeadingClass}>常用库</h2>
              <SkillTagChips
                tags={SKILL_TAGS_LIBRARIES}
                className="flex-1 min-w-0"
              />
            </section>

            <section
              className="flex flex-row flex-wrap gap-x-4 items-start w-full"
              aria-label="常用工具">
              <h2 className={skillHeadingClass}>常用工具</h2>
              <SkillTagChips
                tags={SKILL_TAGS_TOOLS}
                className="flex-1 min-w-0"
              />
            </section>

            <section
              className="flex flex-row flex-wrap gap-x-4 items-start w-full"
              aria-label="爱好">
              <h2 className={skillHeadingClass}>爱好</h2>
              <SkillTagChips
                tags={SKILL_TAGS_MISC}
                className="flex-1 min-w-0"
              />
            </section>
          </section>

          {latestDevLogs.length > 0 ? (
            <section className="mt-12 w-full" aria-label="最近更新">
              <ul className="flex flex-col gap-4 p-0 m-0 list-none">
                {latestDevLogs.map((e) => (
                  <li key={e.fileName} className="min-w-0">
                    <Link
                      to={`/log/${encodeURIComponent(slugFromFileName(e.fileName))}`}
                      className="block min-w-0 w-full rounded-sm text-[var(--fg)] no-underline transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fg)]">
                      <div className="flex flex-row flex-nowrap gap-x-3 items-baseline w-full min-w-0">
                        <h3 className="m-0 min-w-0 flex-1 truncate text-[22px] font-medium leading-tight text-[var(--fg)]">
                          {e.title}
                        </h3>
                        <time
                          className="text-xs tabular-nums opacity-60 shrink-0"
                          dateTime={e.dateTimeAttribute}>
                          {e.dateDisplayShort}
                        </time>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  )
}
