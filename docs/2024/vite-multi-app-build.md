---
date: 2024-09-24
title: Vite 多应用构建项目的一点经验
---

这篇基于仓库 **mobile-service-app-v3**（pnpm + Vue 3 + Vite 5）：同一套依赖里跑多个移动端 H5 子应用（`src/apps` 下如 `plat`、`book-bus`、`charge-user` 等），**不是** pnpm workspace 拆多包，而是 **单 Vite 工程、多 `root`、按应用名当 `mode`**。适合业务上「一套基建、多条业务线各出一站」的场景。

## 核心：`mode` 即应用名，配置里处处跟它走

`package.json` 里不直接调 `vite`，而是用 **`tsx scripts/dev.ts`** / **`tsx scripts/build.ts`**，第二个参数传应用名，脚本会先扫 `src/apps` 目录校验名字存在，再执行：

- 开发：`vite --mode <app>`
- 生产：`rimraf dist/<app> && vue-tsc -b && vite build --mode <app>`

`vite.config.ts` 里用 `process.argv.at(-1)` 取到的就是 **`--mode` 后面的字符串**（即应用名），并据此写死几件事：

| 配置项 | 作用 |
|--------|------|
| `root` | `src/apps/<mode>/`，每个应用自带 `index.html` 与 `main.ts` 入口 |
| `base` | `/<mode>/`，部署在网关或 CDN 子路径下时与目录一致 |
| `build.outDir` | `dist/<mode>`，产物按应用分目录，互不覆盖 |
| `build.rollupOptions.input` | 指向 `src/apps/<mode>/index.html` |
| `resolve.alias` | `@svg` / `@images` / `@@` 等指向**当前应用**目录下的资源；`@` 仍指向公共 `src` |
| `define['process.env'].VITE_APP_MODE` | 把当前应用名打进包，业务里可做分支 |

这一套的本质是：**Vite 只启一个配置对象，但「谁在用」由 `mode` 决定**，换应用等于换一套 root 与别名，而 `src/components`、`src/utils`、`src/service` 等共享代码始终通过 `@` 引用，不必复制。

## 应用长什么样：共享 `entry`，各包一层壳

每个子应用的 `main.ts` 模式很统一：引入本应用的 `App.vue`、本应用 `router`，再 `import entry from '@/main'`——公共的 `src/main.ts` 负责 **Pinia、i18n、Vant/xzx-design 全局样式、预加载** 等，对外暴露 `entry(App, [router], callback)`。这样 **横切能力只维护一份**，纵向只在新应用里写路由和页面。

`index.html` 里 `<script type="module" src="/main.ts">` 相对的是**当前 `root`**，所以每个应用目录下各有一份 `index.html`，互不串台。`vite-plugin-html` 注入的 `title` / `version` / `date` 也会随 `mode` 变（例如 `title` 用 `startCase(mode)`）。

## 脚本与规范：把「选应用」固化成流程

- **开发**：忘记传应用名会直接报错提示 `pnpm dev plat` 这类用法，避免默默起错环境。
- **构建**：在 `vite build` 前跑 **`check-naming`**（`CHECK_ALL_FILES=true`），命名不过则中止——多应用共用仓库时，越早拦住风格漂移成本越低。
- **脚手架**：`pnpm create:app <name>` 用 bash 在 `src/apps/<name>` 下生成 `App.vue`、`main.ts`、`index.html`、`router`、`views/home`，新应用立刻能塞进同一套 Vite 管线。

开发前还有 **`scripts/base.ts`** 写本机 `address.ts`（局域网 IP 等），方便真机或内网联调；这类「非提交物」与构建链耦合时，团队要记得文档里写清，避免新人疑惑为何一启动就改文件。

## 插件与样式：一份配置，多应用复用

`unplugin-vue-components` 的 `dirs` 同时包含 **`src/components` 与 `src/apps/**/components`**，业务组件可按应用下沉，仍享受自动按需注册。PostCSS 里 **Tailwind + px→viewport** 与 `viewport.config` 全仓共用，保证多端宽度策略一致。若某应用需要特殊静态资源隔离，配置里曾预留过按扩展名 `rollup` external 的注释，可按需打开，避免错误引用兄弟应用的素材。

## 落地时注意的几条

1. **`mode` 与 `process.argv`**：配置依赖 CLI 传参顺序，升级 Vite 或改用 Node API 时要复核取 `mode` 的方式是否仍等价。
2. **`base` 与子路径**：`base: '/plat/'` 这类路径要求网关、静态资源前缀与之一致，本地若用根路径预览会需要对 nginx 或 `preview` 心里有数。
3. **类型检查**：`vue-tsc -b` 是**整仓**检查，新增应用若引入不兼容类型，可能影响其他应用的 CI，这是单仓的代价，一般用 `tsconfig` 的 `include`/`references` 或分项目慢慢收紧。
4. **共享状态**：`src/store` 跨应用共用时要分清「全局」与「某条业务线」，必要时用 `VITE_APP_MODE` 或路由前缀隔离，避免 Pinia 里串数据。

## 收束

**单 Vite 配置 + 多 `src/apps/<name>` + `--mode` 驱动 root/base/outDir/别名**，是「多 H5 应用」里较轻的一种工程化：不必维护多个 `package.json`，共享基建极多；代价是**心智上要始终把「当前 mode」当作一等公民**，以及 CI 里按应用维度执行 `pnpm build <app>`。若业务再膨胀到依赖版本都要分叉，再考虑迁到 pnpm workspace 或多仓库不迟；在那之前，这套结构足够把几条业务线收进一个仓里稳定交付。
