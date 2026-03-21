import { useEffect, useMemo, useState } from 'react'
import { MarkdownHooks } from 'react-markdown'
import { Navigate, useParams } from 'react-router-dom'
import rehypeShiki from '@shikijs/rehype'
import remarkGfm from 'remark-gfm'
import type { Components, Options } from 'react-markdown'

import { aiGradientTextClass } from '@/components/DevLogAiStar'
import ParticleBackground from '@/components/ParticleBackground'
import SiteHeaderNav from '@/components/SiteHeaderNav'
import { getDevLogBySlug } from '@/lib/devlogDocs'
import {
  applyThemeClass,
  persistTheme,
  readStoredTheme,
  type Theme
} from '@/lib/themeStorage'

const mdArticleClass =
  '[&>:first-child]:mt-0 [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-[var(--fg)] dark:[&_blockquote]:border-zinc-600 ' +
  /* 行内 code（Shiki 只处理 fenced；未标语言的行内仍用下面样式） */
  '[&_p>code]:rounded [&_p>code]:bg-zinc-200 [&_p>code]:px-1 [&_p>code]:py-0.5 [&_p>code]:text-[0.9em] dark:[&_p>code]:bg-zinc-800 ' +
  '[&_li>code]:rounded [&_li>code]:bg-zinc-200 [&_li>code]:px-1 [&_li>code]:py-0.5 [&_li>code]:text-[0.9em] dark:[&_li>code]:bg-zinc-800 ' +
  '[&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-[#000] dark:[&_h1]:text-white ' +
  '[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-[var(--fg)] ' +
  '[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-[var(--fg)] ' +
  '[&_hr]:my-8 [&_hr]:border-zinc-200 dark:[&_hr]:border-zinc-800 ' +
  '[&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-[15px] [&_ol]:text-[var(--fg)] ' +
  '[&_p]:my-4 [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-[var(--fg)] ' +
  /* Shiki 负责 pre 背景色；这里只保留版式 */
  '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-[13px] [&_pre]:leading-relaxed ' +
  '[&_.shiki]:rounded-lg ' +
  '[&_strong]:font-medium [&_table]:my-0 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[15px] [&_table]:text-[var(--fg)] [&_td]:border [&_td]:border-zinc-200 [&_td]:p-2 dark:[&_td]:border-zinc-700 ' +
  '[&_th]:border [&_th]:border-zinc-200 [&_th]:p-2 dark:[&_th]:border-zinc-700 ' +
  '[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-[15px] [&_ul]:text-[var(--fg)]'

const SHIKI_LANGS: string[] = [
  'bash',
  'shell',
  'javascript',
  'js',
  'typescript',
  'ts',
  'tsx',
  'python',
  'py',
  'yaml',
  'yml',
  'json',
  'text',
  'plaintext',
  'markdown',
  'md'
]

export default function DevLogPage() {
  const { slug } = useParams<{ slug: string }>()
  const entry = slug ? getDevLogBySlug(slug) : null

  const [theme, setTheme] = useState<Theme>(() => readStoredTheme())

  const mdComponents = useMemo<Components>(
    () => ({
      table: ({ children, ...props }) => (
        <div className="my-4 max-w-full overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table {...props}>{children}</table>
        </div>
      )
    }),
    []
  )

  const rehypePlugins = useMemo((): NonNullable<Options['rehypePlugins']> => {
    return [
      [
        rehypeShiki,
        {
          theme: theme === 'dark' ? 'github-dark' : 'github-light',
          langs: SHIKI_LANGS,
          langAlias: {
            sh: 'bash',
            zsh: 'bash',
            yml: 'yaml',
            js: 'javascript',
            ts: 'typescript',
            py: 'python',
            md: 'markdown'
          },
          addLanguageClass: true
        }
      ]
    ]
  }, [theme])

  useEffect(() => {
    applyThemeClass(theme)
    persistTheme(theme)
  }, [theme])

  if (!slug || !entry) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />
      <SiteHeaderNav
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      />

      <main className="relative z-10 px-6 pt-16 pb-20 mx-auto min-w-0 max-w-2xl sm:pt-20">
        <header className="mb-8">
          <h1 className="mt-0 text-[36px] font-semibold leading-tight tracking-tight text-[#000000] dark:text-[#ffffff]">
            {entry.title}
          </h1>
          <div className="flex flex-wrap gap-x-3 items-center mt-2 text-sm tabular-nums">
            <time
              className="text-[var(--fg)] opacity-70"
              dateTime={entry.dateTimeAttribute}>
              {entry.dateDisplayDetail}
            </time>
            {entry.aiRelated ? (
              <span
                className={`font-semibold tracking-tight ${aiGradientTextClass}`}
                aria-label="AI 相关">
                AI ✦
              </span>
            ) : null}
          </div>
        </header>
        <article className={`min-w-0 max-w-full ${mdArticleClass}`}>
          <MarkdownHooks
            remarkPlugins={[remarkGfm]}
            rehypePlugins={rehypePlugins}
            components={mdComponents}
            fallback={
              <p className="text-[15px] text-[var(--fg)] opacity-50">渲染中…</p>
            }>
            {entry.bodyMarkdown}
          </MarkdownHooks>
        </article>
      </main>
    </div>
  )
}
