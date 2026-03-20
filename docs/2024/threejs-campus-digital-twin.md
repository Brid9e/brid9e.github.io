---
date: 2024-12-23
title: Three.js 与三维场景结合的简易数字孪生手记
---

**在线演示**：[city-three 数字孪生 Demo](https://brid9e.github.io/city-three/)（与 Vite `base: '/city-three/'` 一致。）

手记来自 **city-threejs** 这套练习：Vue 3 + Vite + Three.js，把一片「哈工大」校园级的 GLB 场景铺满屏，右边用 Ant Design + ECharts 做场馆列表、人流量折线、楼层占用。先说明白：**没有接高德、Mapbox 或 Leaflet 这类二维地图 SDK**——这里说的「和地图结合」，取的是数字孪生里常见的分工：**三维空间负责「你在哪、长什么样」**，业务组件负责「跑多少数据」；二维电子地图若要做经纬度对齐、贴地、图层同步，是另一条工程量，这篇只记当前这种**轻量、模型-centric** 的做法。

## 空间层：用场景当底图，而不是再铺一张瓦片

主界面是 `ThreeJsContainer`：全屏 `WebGLRenderer`，`PerspectiveCamera` + `OrbitControls`，地面大平面 + 雾效 + 可选天空盒 CubeTexture。`data.json` 里按数组顺序拉多个 GLB：`type: scene` 的整块白模（Matcap + `EdgesGeometry` 描边，透明度很低，像底图）、`type: mesh` 的篮球场、体育场、实验楼体，以及单独拆出来的玻璃外壳（`envMap` 接到天空盒，模拟反射）。

也就是说，**「地图」在这里就是摆好机位的三维场景**——用户在脑子里把导航和地标对应到模型，而不是在地图上拖 marker。对演示、校内 IOC 一类需求，往往比先抠 GIS 再对齐模型要快一截。

## 数据怎么进三维：JSON 驱动 + `userData`

每个 GLB 条目有 `name`、`file`、`params`（材质、是否画线框、自发光、玻璃等），以及 **`data`** 字段：会挂到 mesh 的 `userData` 上。里面除了 `id`、`name`，还有 `area` 数组（楼层人数 `nop`、容量 `capacity`）。这样 **Three 里选中谁，右侧列表和图表就能跟同一份结构**——`@change` 从容器里把当前模型的 `userData` 抛给父组件，人流量折线用 `id` 去 `mockData` 里取序列，不必再维护一套平行字典。

业务侧和三维的粘合点是：**列表点「场馆」→ `defineExpose` 暴露的 `smoothMove` 按 `name` 找到 `scene.getObjectByName`，再飞相机**；点「区域详情」→ 浮层里再起一个 `ThreeJsContainer` 看室内/设备。主场景和详情场景**配置拆开**（主场景雾 + 地面；详情 `bgTransparent: true`、HDR 环境贴图、相机距离限制），避免一套参数硬套两处。

## 相机与动效：从「能看」到「被引导」

`moveCameraTo` 用 **@tweenjs/tween.js** 做二次贝塞尔：起点、控制点、目标点插值，同时 `lookAt` 从旧 `controls.target` 插到新模型世界坐标，结束时把 `OrbitControls.target` 钉在模型上。比直接 `camera.position.set` 更像产品里的「飞到楼栋」——数字孪生里**镜头语言**往往比模型多两个面更重要。

Raycaster 点击拾取在代码里留了注释版：用 `modelList` 过滤地面/天空，只打建筑 mesh。真要接「点楼选楼」，把这段打开即可。

## 工程上的零碎

- **Draco**：大模型走 `decoderPath` 指到 `public` 下的 wasm，GLTFLoader 挂上 `DRACOLoader`，首屏体积会好看很多。
- **HDR**：`RGBELoader` 既可当 `scene.environment` 做 PBR，也可在详情里单独当背景；主场景若透明叠在 UI 下，要小心 `scene.background` 和 `environment` 谁生效。
- **双画布叠加**：详情层 `renderer` 透明、`alpha: true`，外层毛玻璃 `backdrop-filter`，注意 **WebGL 与 CSS 合成** 在低端机上的开销。
- **部署**：Vite `base` 配成 `/city-three/`，静态资源与 GLB 路径要跟着走，否则线上只有白屏。

## 若以后真要「地图 + 三维」

常见做法是：**底图用地图 SDK 管经纬度与缩放**，**上层用 CSS3DRenderer 或 Mapbox 的 custom layer / WebGL 叠加**，把模型坐标从 WGS84 转到场景矩阵；或 **Mapbox globe + three.js** 同画布。当前这条线没走，是因为演示目标只是「楼宇 + 指标」联动，**先把业务数据绑在 `userData`、相机路径和面板状态上跑通**，再决定要不要为真实地理买单。

---

整体感受：**简易数字孪生**可以先做成「可配置的三维场景 + 业务面板 + 相机动画」，地图 SDK 不是第一块积木；把 **JSON 描述模型、GLB 承载空间、Tween 承载叙事** 理顺之后，再叠真实地图会顺很多。
