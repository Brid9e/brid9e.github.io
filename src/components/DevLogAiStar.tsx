/** 列表页角标 / 详情页「AI ✦」共用的蓝紫渐变字色 */
export const aiGradientTextClass =
  'inline-block bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-violet-400 dark:to-fuchsia-300'

/** 开发日志 frontmatter `ai: true` 时标题旁的角标 */
export default function DevLogAiStar() {
  return (
    <sup
      className={`ml-0.5 shrink-0 align-super text-[0.68em] font-normal leading-none ${aiGradientTextClass}`}
      aria-label="AI 相关"
      title="AI 相关">
      ✦
    </sup>
  )
}
