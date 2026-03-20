/** 开发日志：递归收集 docs 下全部 .md（排除 README）；日期可在文件名 YYYY-MM-DD- 前缀或 frontmatter date；可选 YAML title；正文 # 标题或由 frontmatter 覆盖 */
const rawModules = import.meta.glob('../../docs/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>

export type DevLogEntry = {
  /** YYYY-MM-DD，用于按年分组 */
  date: string
  /** 排序用（毫秒） */
  publishedAtMs: number
  /** 供 `<time datetime="">`（纯日期或完整 ISO） */
  dateTimeAttribute: string
  /** 列表 / 首页最近：如 `3/18` 或 `3/18 14:30`（M/DD） */
  dateDisplayShort: string
  /** 详情页时间行：如 `3/18/2026` 或 `3/18/2026 14:30:00` */
  dateDisplayDetail: string
  title: string
  excerpt: string
  /** 相对 `docs/` 的路径（如 `2026/site-notes.md`），作详情路由 id */
  fileName: string
  /** 完整 Markdown 原文 */
  raw: string
  /** 去掉首行 `# 标题` 后的正文，详情页渲染（避免与页头标题重复） */
  bodyMarkdown: string
}

const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})(?:-(.+))?\.md$/

function fileNameFromPath(p: string): string {
  const seg = p.split('/')
  return seg[seg.length - 1] ?? p
}

/** 从 glob 路径得到 `docs/` 之后的相对路径，如 `2026/2026-03-21-a.md` */
function relativePathFromDocsKey(key: string): string {
  const n = key.replace(/\\/g, '/')
  const m = n.match(/docs\/(.+)$/i)
  return m ? m[1] : fileNameFromPath(key)
}

function stripMarkdownLite(s: string): string {
  return s
    .replace(/^```[\s\S]*?```/gm, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const ELLIPSIS = '...'

/** 首页摘要：去掉原文软/硬换行，合并成一段再参与截取 */
function stripLineBreaksForExcerpt(s: string): string {
  return s.replace(/\r\n|\r|\n/g, ' ').replace(/\s+/g, ' ').trim()
}

function excerptFromBody(body: string, maxLen = 140): string {
  const trimmed = body.trim()
  const blocks = trimmed.split(/\n\s*\n/)
  const firstBlockRaw = blocks[0] ?? trimmed
  const restAfterFirst = trimmed.slice(firstBlockRaw.length).trim()
  const hasMoreAfterFirst = restAfterFirst.length > 0

  const firstBlock = stripLineBreaksForExcerpt(firstBlockRaw)
  const plain = stripMarkdownLite(firstBlock)
  const tailIfMore = hasMoreAfterFirst ? ELLIPSIS : ''

  const finish = (out: string) => stripLineBreaksForExcerpt(out)

  if (plain.length <= maxLen) {
    const combined = plain + tailIfMore
    return finish(
      combined.length <= maxLen
        ? combined
        : `${plain.slice(0, maxLen - ELLIPSIS.length)}${ELLIPSIS}`
    )
  }

  return finish(`${plain.slice(0, maxLen - ELLIPSIS.length)}${ELLIPSIS}`)
}

/** 简单 YAML：`key: value`，支持单行双引号/单引号 */
function parseSimpleYaml(yaml: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rawLine of yaml.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let v = line.slice(idx + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    out[key] = v
  }
  return out
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/

function stripFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const t = raw.replace(/^\uFEFF/, '')
  const m = t.match(FRONTMATTER_RE)
  if (!m) return { meta: {}, content: raw }
  return {
    meta: parseSimpleYaml(m[1]),
    content: t.slice(m[0].length)
  }
}

function parseYmdLocalNoon(ymd: string): Date {
  const [y, mo, d] = ymd.split('-').map(Number)
  return new Date(y, mo - 1, d, 12, 0, 0, 0)
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function calendarYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** 输入是否显式包含「时分」等（非纯 YYYY-MM-DD） */
function inputHasTimeComponent(s: string): boolean {
  const t = s.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return false
  return true
}

/** 展示用 M/DD（月不补零、日两位）；含时间时 `M/DD HH:mm` */
function formatShort(d: Date, includeTime: boolean): string {
  const month = d.getMonth() + 1
  const day = pad2(d.getDate())
  if (!includeTime) return `${month}/${day}`
  return `${month}/${day} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** 展示用 M/DD/YYYY；含时间时末尾接 `HH:mm:ss` */
function formatDetail(d: Date, includeTime: boolean): string {
  const month = d.getMonth() + 1
  const day = pad2(d.getDate())
  const y = d.getFullYear()
  if (!includeTime) return `${month}/${day}/${y}`
  const h = pad2(d.getHours())
  const min = pad2(d.getMinutes())
  const sec = pad2(d.getSeconds())
  return `${month}/${day}/${y} ${h}:${min}:${sec}`
}

function resolvePublished(
  metaDate: string | undefined,
  filenameYmd: string
): Pick<
  DevLogEntry,
  | 'date'
  | 'publishedAtMs'
  | 'dateTimeAttribute'
  | 'dateDisplayShort'
  | 'dateDisplayDetail'
> {
  const rawInput = metaDate?.trim()
  if (!rawInput) {
    const d = parseYmdLocalNoon(filenameYmd)
    return {
      date: filenameYmd,
      publishedAtMs: d.getTime(),
      dateTimeAttribute: filenameYmd,
      dateDisplayShort: formatShort(d, false),
      dateDisplayDetail: formatDetail(d, false)
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawInput)) {
    const d = parseYmdLocalNoon(rawInput)
    return {
      date: rawInput,
      publishedAtMs: d.getTime(),
      dateTimeAttribute: rawInput,
      dateDisplayShort: formatShort(d, false),
      dateDisplayDetail: formatDetail(d, false)
    }
  }

  const d = new Date(rawInput)
  if (Number.isNaN(d.getTime())) {
    const fallback = parseYmdLocalNoon(filenameYmd)
    return {
      date: filenameYmd,
      publishedAtMs: fallback.getTime(),
      dateTimeAttribute: filenameYmd,
      dateDisplayShort: formatShort(fallback, false),
      dateDisplayDetail: formatDetail(fallback, false)
    }
  }

  const date = calendarYmd(d)
  const hasTime = inputHasTimeComponent(rawInput)
  return {
    date,
    publishedAtMs: d.getTime(),
    dateTimeAttribute: hasTime ? d.toISOString() : date,
    dateDisplayShort: formatShort(d, hasTime),
    dateDisplayDetail: formatDetail(d, hasTime)
  }
}

function parseMarkdown(raw: string): { title: string; body: string } {
  const t = raw.trim()
  const m = t.match(/^#\s+(.+)$/m)
  if (m) {
    const title = m[1].trim()
    const after = t.slice(m.index! + m[0].length).trim()
    return { title, body: after }
  }
  return { title: '', body: t }
}

function isReadmeBaseName(baseName: string): boolean {
  return /^readme\.md$/i.test(baseName)
}

/** 无日期文件名时，供 resolvePublished 在解析失败时作后备的 YYYY-MM-DD */
function fallbackYmdFromMetaDate(meta: Record<string, string>): string {
  const d = meta.date?.trim()
  if (!d) return '2000-01-01'
  const m = d.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : '2000-01-01'
}

function parseFile(filePath: string, raw: string): DevLogEntry | null {
  const relPath = relativePathFromDocsKey(filePath)
  const baseName = fileNameFromPath(relPath)
  if (isReadmeBaseName(baseName)) return null

  const dm = baseName.match(DATE_PREFIX)
  const { meta, content } = stripFrontmatter(raw)
  const { title: mdTitle, body } = parseMarkdown(content)
  const title =
    (meta.title?.trim() || mdTitle.trim() || 'Untitled').trim() || 'Untitled'

  if (dm) {
    const filenameDate = dm[1]
    const pub = resolvePublished(meta.date, filenameDate)
    return {
      ...pub,
      title,
      excerpt: excerptFromBody(body),
      fileName: relPath,
      raw,
      bodyMarkdown: body
    }
  }

  if (!meta.date?.trim()) return null
  const pub = resolvePublished(meta.date, fallbackYmdFromMetaDate(meta))
  return {
    ...pub,
    title,
    excerpt: excerptFromBody(body),
    fileName: relPath,
    raw,
    bodyMarkdown: body
  }
}

function loadAll(): DevLogEntry[] {
  const out: DevLogEntry[] = []
  for (const [path, raw] of Object.entries(rawModules)) {
    const entry = parseFile(path, raw)
    if (entry) out.push(entry)
  }
  return out.sort((a, b) => {
    const byMs = b.publishedAtMs - a.publishedAtMs
    if (byMs !== 0) return byMs
    return b.fileName.localeCompare(a.fileName)
  })
}

const allSorted = loadAll()

/** 全部日志（按发布时间降序） */
export const allDevLogs: DevLogEntry[] = allSorted

/** 首页「最近」区块：最新 5 篇 */
export const latestDevLogs: DevLogEntry[] = allDevLogs.slice(0, 5)

export type YearGroup = {
  year: string
  entries: DevLogEntry[]
}

/** 按年份分组，年份降序；年内条目按发布时间降序 */
export function groupDevLogsByYear(entries: DevLogEntry[]): YearGroup[] {
  const map = new Map<string, DevLogEntry[]>()
  for (const e of entries) {
    const year = e.date.slice(0, 4)
    if (!map.has(year)) map.set(year, [])
    map.get(year)!.push(e)
  }
  const years = [...map.keys()].sort((a, b) => b.localeCompare(a))
  return years.map((year) => {
    const list = map.get(year)!
    list.sort((a, b) => {
      const byMs = b.publishedAtMs - a.publishedAtMs
      if (byMs !== 0) return byMs
      return b.fileName.localeCompare(a.fileName)
    })
    return { year, entries: list }
  })
}

/** `2026/site-notes.md` → `2026/site-notes`（URL 段需再 encodeURIComponent） */
export function slugFromFileName(fileName: string): string {
  return fileName.replace(/\.md$/i, '')
}

export function getDevLogBySlug(slug: string): DevLogEntry | null {
  const decoded = decodeURIComponent(slug)
  const fileName = decoded.endsWith('.md') ? decoded : `${decoded}.md`
  return allDevLogs.find((e) => e.fileName === fileName) ?? null
}
