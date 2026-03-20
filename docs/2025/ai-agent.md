---
date: 2025-12-20
title: 多 MCP、多轮任务的 Agent：一点心路
---

一开始想解决的是：**不只要多路 MCP，还要像一个真正的 Agent 一样——同一轮对话里可以反复「想一步 → 调工具 → 看结果 → 再想」**，直到任务收束或触达上限。MCP（Model Context Protocol）把工具拆成独立进程或服务；我在上面叠的是 **HTTP 网关 + 多连接聚合 + 模型侧多轮工具循环**，再用 Vite 页面把流式过程摊开给人看。

## 多 MCP：工具箱是「并联」的

单 MCP 很快不够：有的是本机 **stdio** 起的 Python 工具，有的是远端 **SSE** 或 **Streamable HTTP**。配置里按名字挂多路，启动时对各 session `list_tools`，把名字空间并到同一套对话里——模型**一次**就能看见所有可用工具，按意图选用，而不是我写死一条流水线。

大意上，`config.yaml` 里按传输方式分块即可（名字即代码里取 session 的 key）：

```yaml
stdio:
  system:
    path: server/system.py
sse:
  remote_tools:
    url: http://example.internal:8001/sse
```

## 多轮：Agent 不是「一问一答」

和「只问一句、返回一句」不同，这里核心是 **多轮工具循环**：用户发一条需求后，模型可能连续若干轮：

1. 决定调用哪些工具、参数是什么；
2. 网关执行 MCP，把结果写回上下文；
3. 模型再读结果，决定要不要继续调、还是直接总结。

配置里会有 `max_iterations` 一类上限，防止死循环；流式输出时，每一轮工具调用、中间思考、最终回复都要在 UI 上**分段可见**，否则用户只看到最后一行字，会以为 Agent 什么都没干。

用伪代码描述这个循环就是：

```text
while 轮次 < max_iterations 且 未结束:
  模型输出 → 若有 tool_calls → 执行 MCP → 结果追加到消息历史
  若无 tool_calls 或 需要结束 → break
```

前端这边（例如 `useChat`）则要盯紧：**流式结束、异常、断连**时，把「执行中」的工具状态统一收尾，避免界面卡在半格动画里。

## 异步连接：每个 MCP 一条命，别跨任务乱关

**STDIO / SSE / Streamable HTTP** 都收成同一种模式：**每个 MCP 一条后台 `runner`**，里面自己进 `AsyncExitStack`、`initialize`、注册 session；外面用 `ready_event` 等就绪、用 `stop_event` 停机，`finally` 里在同一条任务里 `aclose()`。这样多路连接时，**哪一路挂了**不至于把整进程拖进不可预期的关闭顺序。

```python
async def runner():
    async with AsyncExitStack() as stack:
        transport = await stack.enter_async_context(open_transport(...))
        session = await stack.enter_async_context(ClientSession(...))
        await session.initialize()
        ready_event.set()
        await stop_event.wait()
```

## 网关与页面：把 Agent 跑在工程里

入口是 **FastAPI + Uvicorn**：会话与历史、模型提供商、多轮工具循环、流式响应；敏感项走环境变量。再往外是鉴权、存储、任务执行等积木——**没有这些，Agent 只能在自己机器上玩**，上不了真实环境。

本地联调常见：

```bash
uv run main.py          # 网关，默认例如 8000
cd page && pnpm dev     # 对话页
```

## 真实感受

- **多 MCP + 多轮** 叠加后，难的不在 prompt，而在 **超时、重试、历史截断**——每一轮都可能很长。
- **配置驱动**仍然救命：加工具、改模型，尽量只动 YAML，少动核心循环。
- 若一句话总结：**我要的不是聊天壳，而是一个能同时挂多路 MCP、又能多轮啃任务、还能部署的 Agent 管线**——后面还会迭代，先记到这儿。
