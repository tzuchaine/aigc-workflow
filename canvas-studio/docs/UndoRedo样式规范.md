# Dify 画布操作条样式规范（UndoRedo 组件已按此实现）

本规范提炼自 Dify 画布工具条的视觉与交互设计，适用于画布上的撤销/重做、历史、视图控制等浮动操作条。`apps/web/src/features/workflow/components/UndoRedo.tsx` 已按本规范实现，可作为落地示例。

## 设计语言与主题
- 质感：磨砂玻璃 + 细边框 + 阴影，突出悬浮且不抢占画布主体。
- 令牌：使用 `components-actionbar-*`、`text-*`、`state-*` 等主题变量，避免硬编码颜色。
- 风格：圆角、线性图标（lucide 系）、轻量 hover，保持简洁的工具条观感。

## 容器
- 布局：`flex` 水平排列，`items-center`，子项间距 `space-x-0.5`。
- 外观：`rounded-lg`，0.5px 边框 `border-components-actionbar-border`，背景 `bg-components-actionbar-bg`，`p-0.5` 内边距，`shadow-lg` + `backdrop-blur-[5px]`。
- 定位：悬浮于画布上方，与 Dify 的浮动工具条一致。

## 按钮
- 尺寸：单元 `h-8 w-8`（32px），图标 `h-4 w-4`（16px）。
- 布局：`flex` 居中，`rounded-md`，左右内边距 `px-1.5`，`select-none`。
- 图标：lucide 线性风格，保持统一笔触。

## 交互状态
- 默认：文字 `text-text-tertiary`，背景透明。
- 悬停：`hover:bg-state-base-hover`，文字 `text-text-secondary`。
- 禁用：`cursor-not-allowed text-text-disabled`，hover 保持透明与禁用色。
- 分隔符：`Divider type="vertical"`，`h-3.5`，`mx-0.5` 维持节奏感。

## 快捷键与可用性
- 快捷键：`Ctrl+Z` 撤销，`Ctrl+Shift+Z` 或 `Ctrl+Y` 重做，需在启用快捷键模式时生效。
- 可用性：按钮禁用态由历史栈决定（无 past 禁用撤销，无 future 禁用重做），避免误触。
- 提示：Tooltip 必填，展示操作名称与快捷键，确保可发现性。

## 数据与状态驱动
- 历史订阅：监听时间旅行状态（past/future），实时更新禁用态，初始挂载即同步一次避免闪烁。
- 历史面板：历史列表入口放在同一操作条，保持交互聚合。

## 复用与扩展
- 新增操作（清空、保存、对齐等）应沿用 32px 规格、同一 hover/禁用模式与 Tooltip 规则。
- 若新增分组，继续使用 Divider 控节奏；复杂操作可放入面板但入口仍遵循本按钮规格。
- 需保持磨砂背景、细边框与主题令牌，保证与 Dify 操作条一致的层级与质感。
