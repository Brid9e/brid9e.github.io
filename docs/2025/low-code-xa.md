---
date: 2025-04-03
title: 低代码编辑器「xa / ob」：结构小结
---

这篇记的是本地仓库 **xa** 里的工程（根 `package.json` 里名字叫 **ob**）：一套偏「可视化搭页面 → 落盘成 Vue 源码」的低代码取向实践，不是大厂那种全家桶，但把几条主线拆清楚之后，后面无论重写还是扩功能都有坐标。工程整体按 **Monorepo** 组织：编辑器、代码生成、表达式运行时和公共类型**同仓迭代**，用工作区协议锁版本，而不是拆成多个 npm 包各自发版再对齐。

## Monorepo：pnpm workspace 与同仓多包

仓库根目录用 **pnpm** 管理，`pnpm-workspace.yaml` 里一句 `packages: ['packages/*']` 把子包整包拉进工作区。每个子目录有自己的 `package.json`（作用域名统一在 **`@ob/*`** 下），包与包之间用 `workspace:*` 互引，本地改一行生成器逻辑，**不用先发包**就能被 `@ob/ui` 立刻消费——这对低代码特别省事：Schema、生成产物和预览跑在同一套类型与工具函数上，避免「编辑器 A 版、生成器 B 版」的隐性分叉。

根工程还集中放了 **引擎约束**（如 `packageManager: pnpm@8.x`）、以及 `pnpm --filter @ob/ui dev` / `@ob/play` / `@ob/expression-engine` 这类**按包脚本**；**lint / prettier / husky** 也会在整仓范围内跑，风格与提交钩子只维护一份。换句话说，Monorepo 在这里不是噱头，而是把「UI 壳子」和「真算代码的那几层」绑成一条可维护的供应链。

## 问题形状：画布上的树 + 每节点的配置面板

和多数页面搭建器一样，运行时心智模型可以压成两块：

1. **结构树** (`containerData`)：谁在谁下面、顺序是什么、根节点是谁——本质是一棵（或多页场景下的多棵）组件实例树。
2. **属性面板的快照** (`elementsPanelMap`)：每个节点 id 对应一块「表单里配出来的东西」：样式尺寸、组件 props、是否绑表达式等。生成器读的是「树 + 面板」，而不是单靠 DOM。

另有一块 **上下文数据** (`ctxData`) 用来承载运行/预览时要喂给表达式或变量的数据；保存时和树、面板一起打进 `SavedData`，便于整套方案序列化、再打开。Pinia 里 `useContainer` 把增删改、嵌套预设组件时重写 id 等脏活收口，编辑器组件只负责触发 action——状态集中之后，代码生成和预览才能对同一份真相之源工作。

## 包怎么切：`packages/*` 里的职责

Monorepo 里每个包一块责任田，大致如下（均在 `packages/` 下）：

- **`@ob/types`**：`ContainerItem`、`SavedData`、`PanelState` 等与树、面板、持久化相关的类型约定——UI 和 generator 都盯这一份，改字段时 TypeScript 会帮你扫一遍引用面。
- **`@ob/utils`**：`v-model` 助手、表达式求值胶水、`pick-config`、`panel-to-css` 等与 JSON ↔ 运行时/样式相关的纯函数，给 UI 和生成器共用。
- **`@ob/components`**：物料侧可复用的基础组件（与搭建器里的「拖出来的是什么」相关），和编辑器 UI 解耦一层，方便在 `@ob/play` 里单测或 Story 式验证。
- **`@ob/hooks`**：画布拖拽、选中高亮与辅助线、变量变换等与 **DOM/交互强相关** 的逻辑，避免 `@ob/ui` 页面里事件监听堆成山。
- **`@ob/ui`**：Vue 3 + Vite，界面是 PrimeVue + 少量 Tailwind；左侧树/物料、中间画布、右侧属性区，另有一个基于 **Vue Flow** 的流程抽屉（`flow-zone`），和页面搭建并列存在。
- **`@ob/generator`**：核心产物是 **`generateSource` → `generateVueSource`**：按容器递归展平组件项，把 `elementsPanelMap` 和树节点喂给模板/脚本/CSS 生成管线；输出是多份 `.vue` 文件内容（路径形如 `src/components/<componentName>.vue`）。生成侧会处理外部组件收集、`computed`/`reactive` 是否必要、以及样式里的 CSS 变量绑定——也就是说「低代码」在这里明确收口为 **可读的 Vue SFC**，而不是私有二进制格式锁死用户。
- **`@ob/expression-engine`**：基于 **JEXL**，再注册一批业务函数；`@ob/utils` 里的表达式求值会把 `{{path}}` 这类占位先换成 JSON5 字面量，再交给引擎算——编辑态预览和生成后的运行时要能讲同一种表达式语言。
- **`@ob/play`**：小型 Vue 试验场，用来接生成结果或组件库局部联调，和主编辑器解耦。

这种「同一工作区、多包分层」的好处是：**壳（`@ob/ui`）可以整体替换**，只要 **`@ob/types` 与 `SavedData` 形状**稳定，**`@ob/generator` 与 `@ob/expression-engine` 仍可复用**；对团队来说则是单仓 MR 能同时改 Schema、生成与预览，减少跨仓库扯皮。

## 低代码里真正费心的地方

若只做一个「拖组件、调属性」的 demo，工程量并不大；要做到「能导出成正常工程里可维护的 Vue」，通常要额外对付这几类问题：

- **标识与克隆**：预设组件、复制粘贴、嵌套子画布时，节点 id 和 `elementsPanelMap` 的 key 必须成套重写，否则面板和树会指到同一套旧 id，生成器会串台。`container` store 里对 `originData` 展开时的递归改 id，就是在付这笔账。
- **样式与绑定**：面板里常常是 px、flex、变量混用；生成阶段要把它们变成 **scoped 样式 + CSS 变量**（或内联绑定），才能让导出文件在真实项目里不靠编辑器运行时也能跑。
- **表达式与类型**：JEXL 灵活，但错误要在 UI 里变成「哪条绑定错了」而不是裸栈；utils 里对未知函数的汉化提示，属于产品体验层的小但必要的胶水。

## 一句话收束

**xa / ob** 这条线的本质是：**用树 + 面板 JSON 描述界面，用 hooks 承载复杂交互，用 JEXL 统一动态行为，最后用 generator 把这一切还原成人能读的 Vue SFC**——低代码没有消失，只是从「永远关在自己服务器里的 JSON」变成了「可带走、可 diff、可 code review 的源码」。**Monorepo** 把这几层绑在一个仓库里迭代，复用时可以整仓 fork，也可以只抽 **`@ob/types` + `@ob/generator` + `@ob/expression-engine`** 当作无 UI 的「编译后端」；最值得沉淀的仍是 **数据模型约定 + 生成管线 + 表达式子集**，而不是某一屏具体用了哪个 UI 库。
