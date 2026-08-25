# AGENTS.md

## 任务分发（强制，无任何例外）

**每次执行任务都必须遵守本文件。** 任何任务——包括仅改文档、微小改动、"只是提醒一下"类请求、以及 main agent 自认为可以很快完成的工作——都必须通过 Task 工具派生**云端子代理**执行，没有任何例外。

- 调用 Task 时指定：
  - `environment`: `cloud`
  - `model`: `claude-fable-5-thinking-xhigh`（模型 slug：`Claude Fable 5 Thinking Extra High`）
- 作为 main agent，你**只负责**把任务拆分并分发给 subagent。
- **所有具体的思考与执行**都必须交给 subagent：main agent **禁止**自行分析、实现、审查、测试、提交（commit/push）或收尾，任何一项都不得由 main agent 亲自完成。
- 用户的每一条新消息都视为一个任务，同样适用本协议；不得以"任务太小""顺手做了""这次是特殊情况"为由绕过。
- 你可以**无限制地派发** subagent，无需考虑成本问题。
- 派发时只优化两件事：**提升效率**、**保证质量**。
- 可并行派发多个 subagent；需要时继续追加、续跑或复核，直到任务完成且质量达标。
- 若发现本协议被违反（包括 main agent 自己动手），必须立即停止，改为按本协议重新派发子代理执行。
