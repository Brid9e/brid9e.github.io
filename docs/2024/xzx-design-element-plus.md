---
date: 2024-09-17
title: 从 Element Plus 到 xzx-design：组件库魔改与 Monorepo 入门
---

**在线文档**：[Xzx Design 组件库](https://ecampus-test.xzxpay.com.cn/xzx-design/v1/)（前端规范与组件说明。）

手记来自 **xzx-design**：Vue 3 组件库，工程骨架和工具链明显承自 **Element Plus** 那一套（`internal/build`、`theme-chalk`、`pnpm gen` 脚手架、VitePress 文档结构等），再按公司品牌与业务（含移动端/桌面端构建切换）改成 **`@xzx-design/*`** 作用域。和从零写一个 UI 库相比，**站在成熟开源工程的肩膀上改**，省掉大量「目录怎么拆、包怎么打、类型怎么出」的摸索时间；代价是要读得懂别人的构建脚本，以及遵守团队定下的约束（例如样式不进 `scoped`、统一走 `theme-chalk`）。

## 「魔改」具体改了什么

- **品牌与导出**：对外包名 **`xzx-design`**，组件前缀 **`Xzx`** / 标签 **`xzx-*`**，和 Element Plus 的命名空间彻底脱钩，避免和业务里其它 UI 库冲突。
- **主题**：样式集中在 **`packages/theme-chalk`**，用 gulp/sass 打主题与变量；业务换肤、换 token 主要动这一支，而不是在单个 `.vue` 里堆 `scoped`——README 里也明确写了：**不要在组件里用空的 `<style scoped>` 去改样式**，可计算部分用内联 `:style`，其余进 scss，否则容易和打包链路打架。
- **多端**：根目录有 **`device.config.ts`**、`device:config` 与 **`build:mobile`** / 默认 `build`，同一套组件按设备维度出不同产物，适合既要 H5 又要后台管理类页面的公司场景。
- **工程脚本**：`pnpm gen` 生成组件骨架、`pnpm scss` 补样式文件；新组件要手动挂到 **`packages/components/index.ts`**、`packages/xzx-design/component.ts` 和 **`theme-chalk`** 的入口——**第一次会觉得烦，恰恰是 Monorepo 里「显式边界」的体现**：少一处导出，play 或文档就对不上。

底层仍能看到 Element Plus 的影子（例如部分 `internal` 包描述、构建常量里曾有的品牌名），业务代码里也会参考社区 issue（例如表单相关和 **Vant** 侧的问题链）做兼容。也就是说：**主线是 EP 式工程，局部实现会交叉看其它库的坑**，这很正常。

## Monorepo：我是从这套工程才真正看懂的

以前对 **Monorepo** 只有概念：多个包放在一个工程里。扎进 xzx-design 之后，才落地成几件具体事：

- **pnpm workspace** 把 `packages/*`、`play`、`docs` 绑在一起，根目录一条 `pnpm install`，子包用 **`workspace:*`** 互引，改 `hooks` 立刻被 `components` 吃到，**不用先发包再联调**。
- **职责切开**：`components` 管 Vue SFC，`theme-chalk` 管样式，`hooks` / `utils` / `locale` 管横切能力，`internal/build` 管 rollup 式产出——**改构建不用翻业务组件**，改组件不用猜样式从哪来。
- **play 与 docs**：`play` 里全局注册试组件，`docs` 用 VitePress 写文档——**消费自己产出的方式**和真实业务很像，调试路径短。

不敢说「精通」，但至少从这个时候开始，**读得懂 `pnpm -C`、`run -r`、stub、多 tsconfig** 在干什么，后面做 **Zerb** 那种多包低代码工程时，心理负担小很多。

## 搭建 Zerb 时怎么用上的

**Zerb**（低代码编辑器那套）里除了 PrimeVue 等通用依赖，**魔改后的 `xzx-design`** 也参与搭建：统一图标（如 `@xzx-design/icons-vue`）、主题样式和部分业务向组件，让 **设计 token、组件 API、主题变量**和公司其它 H5/中后台对齐，低代码产出的页面不会看起来像「另一套皮肤」。需要扩展时，也可以先在 xzx-design 里加组件或改主题，再在 Zerb 里当物料挂上去，**一条链路从组件库到低代码**，而不是各维护各的。

当然，组件库和编辑器仍是两个工程：Zerb 里用 workspace 或 npm 依赖引用 **`xzx-design`**，版本要对齐；Monorepo 的经验主要帮你**知道该改哪、怎么联调、怎么拆包**，而不是混在一起成一团。

## 总结

- **从 Element Plus 工程魔改成 xzx-design**，本质是换品牌、换主题、换构建维度（如 mobile），并遵守团队样式与导出规范。  
- **Monorepo + workspace** 是在这套工程里第一次真正跑通理解的，对后来 **Zerb** 的多包拆分帮助很大。  
- **Zerb 搭建时沿用魔改后的 xzx-design**，让低代码和业务线在 UI 上同一条绳，少一层「编辑器专用皮肤」的维护成本。

若你也在维护公司级组件库：**别羞于从成熟开源 fork/参考**，把精力留在设计规范与业务组件上；同时把 **play、文档、主题、构建** 四条腿跑稳，比单纯堆组件重要得多。
