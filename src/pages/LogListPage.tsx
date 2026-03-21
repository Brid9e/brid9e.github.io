import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import DevLogAiStar from '@/components/DevLogAiStar'
import ParticleBackground from '@/components/ParticleBackground'
import SiteHeaderNav from '@/components/SiteHeaderNav'
import {
  allDevLogs,
  groupDevLogsByYear,
  slugFromFileName
} from '@/lib/devlogDocs'
import {
  applyThemeClass,
  persistTheme,
  readStoredTheme,
  type Theme
} from '@/lib/themeStorage'

export default function LogListPage() {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme())
  const byYear = useMemo(() => groupDevLogsByYear(allDevLogs), [])

  useEffect(() => {
    applyThemeClass(theme)
    persistTheme(theme)
  }, [theme])

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />
      <SiteHeaderNav
        theme={theme}
        onToggleTheme={() =>
          setTheme((t) => (t === 'light' ? 'dark' : 'light'))
        }
      />

      <main className="relative z-10 px-6 pt-16 pb-20 mx-auto max-w-2xl sm:pt-20">
        <h1 className="mt-0 text-[36px] font-bold leading-tight tracking-tight text-[#000000] dark:text-[#ffffff]">
          Blog
        </h1>

        {byYear.length === 0 ? (
          <p className="mt-8 text-[15px] text-[var(--fg)] opacity-80">
            暂无内容。
          </p>
        ) : (
          <div className="flex flex-col gap-12 mt-10">
            {byYear.map(({ year, entries }) => (
              <section key={year} aria-label={`${year} 年`}>
                <h2 className="mb-3 mt-0 text-[30px] font-bold tabular-nums leading-tight text-[#000000] dark:text-[#ffffff]">
                  {year}年
                </h2>
                <ul className="flex flex-col gap-4 pl-4 m-0 list-none border-l border-zinc-200 dark:border-zinc-700">
                  {entries.map((e) => (
                    <li key={e.fileName}>
                      <Link
                        to={`/log/${encodeURIComponent(slugFromFileName(e.fileName))}`}
                        className="flex flex-row items-baseline justify-between gap-4 rounded-sm text-[var(--fg)] no-underline transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fg)]">
                        <h3 className="m-0 flex min-w-0 flex-1 items-baseline gap-0.5 text-[20px] font-medium leading-tight text-[var(--fg)]">
                          <span className="min-w-0">{e.title}</span>
                          {e.aiRelated ? <DevLogAiStar /> : null}
                        </h3>
                        <time
                          className="text-xs tabular-nums opacity-60 shrink-0"
                          dateTime={e.dateTimeAttribute}>
                          {e.dateDisplayShort}
                        </time>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
