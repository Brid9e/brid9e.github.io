import { Icon } from '@iconify/react'
import { NavLink } from 'react-router-dom'

import ThemeToggleLineMdIcon from '@/components/ThemeToggleLineMdIcon'
import {
  BILIBILI_URL,
  GITHUB_PROFILE_URL,
  NPM_PROFILE_URL,
  STEAM_PROFILE_URL
} from '@/constants/social'

type Theme = 'light' | 'dark'

type Props = {
  theme: Theme
  onToggleTheme: () => void
}

const iconLinkClass =
  'inline-flex shrink-0 text-[var(--fg)] opacity-70 transition-opacity hover:opacity-100'

export default function SiteHeaderNav({ theme, onToggleTheme }: Props) {
  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 flex w-full items-center justify-end gap-4 border-b border-zinc-200/70 bg-zinc-50/75 px-6 py-3 backdrop-blur-[8px] sm:gap-5 sm:px-8 sm:py-4 dark:border-zinc-800/80 dark:bg-zinc-950/70"
      aria-label="站点导航">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          [
            'shrink-0 text-sm font-medium text-[var(--fg)] no-underline transition-opacity hover:opacity-100',
            isActive ? 'opacity-100' : 'opacity-80'
          ].join(' ')
        }>
        Home
      </NavLink>
      <NavLink
        to="/blog"
        className={({ isActive }) =>
          [
            'shrink-0 text-sm font-medium text-[var(--fg)] no-underline transition-opacity hover:opacity-100',
            isActive ? 'opacity-100' : 'opacity-80'
          ].join(' ')
        }>
        Blog
      </NavLink>

      <div
        className="flex gap-3 items-center pl-4 border-l border-zinc-200 dark:border-zinc-700"
        aria-label="社交链接">
        <a
          href={GITHUB_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={iconLinkClass}
          aria-label="GitHub">
          <Icon icon="simple-icons:github" className="w-4 h-4" aria-hidden />
        </a>
        <a
          href={NPM_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={iconLinkClass}
          aria-label="npm">
          <Icon icon="simple-icons:npm" className="w-4 h-4" aria-hidden />
        </a>
        <a
          href={BILIBILI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={iconLinkClass}
          aria-label="哔哩哔哩">
          <Icon icon="simple-icons:bilibili" className="w-4 h-4" aria-hidden />
        </a>
        <a
          href={STEAM_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={iconLinkClass}
          aria-label="Steam 个人主页">
          <Icon icon="simple-icons:steam" className="w-4 h-4" aria-hidden />
        </a>
      </div>

      <button
        type="button"
        onClick={onToggleTheme}
        className="inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 text-[var(--fg)] opacity-60 transition-opacity hover:opacity-100 cursor-pointer"
        aria-label={theme === 'light' ? '切换为深色模式' : '切换为浅色模式'}>
        <ThemeToggleLineMdIcon theme={theme} />
      </button>
    </nav>
  )
}
