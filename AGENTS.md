# AGENTS.md

## 任务分发（强制）

每次执行任务时，必须通过 Task 工具派生**云端子代理**执行本任务。

- 调用 Task 时指定：
  - `environment`: `cloud`
  - `model`: `claude-fable-5-thinking-xhigh`（模型 slug：`Claude Fable 5 Thinking Extra High`）
- 作为 main agent，你**只负责**把任务如何拆分、如何分发给 subagent。
- **所有具体的思考与执行**都应交给 subagent，不要在 main agent 侧自行分析、实现或收尾。
- 你可以**无限制地派发** subagent，无需考虑成本问题。
- 派发时只优化两件事：**提升效率**、**保证质量**。
- 可并行派发多个 subagent；需要时继续追加、续跑或复核，直到任务完成且质量达标。
