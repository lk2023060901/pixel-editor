# Development Plan

Last updated: 2026-03-26

## Status Definitions

- `未开始`: 功能尚未进入实现阶段
- `开发中`: 功能正在实现，尚未进入完整验证
- `测试中`: 功能开发已基本完成，正在进行测试和回归验证
- `已完成`: 功能已实现并通过约定的测试与验收

## Update Rule

- 每完成一个功能后，必须同步更新本表的状态列。
- 如果功能已编码但未完成验证，只能标记为 `测试中`，不能提前标记为 `已完成`。
- 当前状态必须反映仓库真实落地情况，不能按计划预填完成状态。

## Feature Tracker

| ID | 功能域 | 功能项 | 主要依赖 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| DOC-001 | 文档 | 架构总览文档 | 无 | 已完成 | `docs/architecture/system-overview.md` |
| DOC-002 | 文档 | 模块边界文档 | DOC-001 | 已完成 | `docs/architecture/module-boundaries.md` |
| DOC-003 | 文档 | 开发路线图文档 | DOC-001 | 已完成 | `docs/architecture/development-roadmap.md` |
| DOC-004 | 文档 | 编码规范文档 | DOC-001 | 已完成 | `docs/architecture/coding-standards.md` |
| DOC-005 | 文档 | 功能状态计划表 | DOC-001 | 已完成 | 本文档 |
| FND-001 | 基础设施 | Monorepo 工作区骨架 | DOC-001 | 已完成 | 已建立 apps/packages workspace，并完成依赖安装验证 |
| FND-002 | 基础设施 | TypeScript 严格配置 | FND-001 | 已完成 | `npm run typecheck` 已通过 |
| FND-003 | 基础设施 | Lint 与测试基础设施 | FND-001 | 已完成 | `npm run lint` 与 `npm test` 已通过 |
| FND-004 | 基础设施 | Next.js Web 应用壳 | FND-001 | 已完成 | 首页、项目页、健康检查路由与构建链路已通过验证 |
| FND-005 | 基础设施 | Worker 应用骨架 | FND-001 | 已完成 | worker 入口已运行验证 |
| FND-006 | 基础设施 | Docs 入口与文档索引 | DOC-001 | 已完成 | `docs/README.md` 与架构索引已建立 |
| DOM-001 | 领域模型 | 基础 ID 与引用模型 | FND-002 | 开发中 | 已落地 branded ID 基础设施，后续需补更多引用约束 |
| DOM-002 | 领域模型 | Map 实体与地图元数据模型 | DOM-001 | 开发中 | 已实现基础 map factory 与设置模型 |
| DOM-003 | 领域模型 | 图层树模型 | DOM-002 | 开发中 | 已实现 tile/object/image/group layer 基础结构 |
| DOM-004 | 领域模型 | Tile 与 Tileset 模型 | DOM-001 | 开发中 | 已实现 tileset、tile、animation、wang set 基础结构 |
| DOM-005 | 领域模型 | Object 模型 | DOM-001 | 开发中 | 已实现主要 object shape 基础数据结构 |
| DOM-006 | 领域模型 | 自定义属性与类型系统 | DOM-001 | 开发中 | 已实现 property 与 enum/class type 基础结构 |
| DOM-007 | 领域模型 | Infinite Map Chunk 模型 | DOM-002 | 开发中 | 已实现 chunk 数据结构，尚未进入完整编辑链路 |
| DOM-008 | 领域模型 | Project 模型 | DOM-001 | 开发中 | 已实现项目元数据基础模型 |
| DOM-009 | 领域模型 | Template 模型 | DOM-005 | 开发中 | 已实现 object template 基础模型 |
| DOM-010 | 领域模型 | World 模型 | DOM-002 | 开发中 | 已实现 world 基础模型 |
| CMD-001 | 命令系统 | Command 接口与执行上下文 | DOM-001 | 开发中 | 已实现 history command 接口与 command factory |
| CMD-002 | 命令系统 | Undo/Redo 历史栈 | CMD-001 | 开发中 | 已实现基础 history stack，并有单元测试 |
| CMD-003 | 命令系统 | Macro Command | CMD-001 | 已完成 | 已实现 macro command，并通过单元测试 |
| CMD-004 | 命令系统 | Mergeable Command | CMD-001 | 开发中 | 已实现命令合并基础机制，并有单元测试 |
| SES-001 | 编辑器状态 | 活动文档与会话状态 | DOM-002, CMD-002 | 开发中 | 已实现 workspace/session 基础状态容器 |
| SES-002 | 编辑器状态 | Selection 状态 | SES-001 | 开发中 | 已实现 selection 基础类型 |
| SES-003 | 编辑器状态 | Tool 状态 | SES-001 | 开发中 | 已实现 active tool 基础状态 |
| SES-004 | 编辑器状态 | Viewport 状态 | SES-001 | 开发中 | 已实现 viewport 基础状态 |
| IO-001 | 格式兼容 | TMJ 读取 | DOM-002, DOM-003, DOM-004, DOM-005, DOM-006 | 开发中 | 已新增 `@pixel-editor/tiled-json` 适配包，支持将 TMJ JSON 读取为 normalized import result：覆盖 map settings、tile/object/image/group layers、tile flips、基础 properties 与 tileset references；并已接入 `app-services` / workspace 导入 API 与控制器测试，剩余更完整兼容性待补 |
| IO-002 | 格式兼容 | TMJ 写入 | IO-001 | 开发中 | 已在 `@pixel-editor/tiled-json` 增加 deterministic TMJ serializer：覆盖 finite/infinite tile layers、object/image/group layers、tile flip flags、object reference property 映射与 round-trip 测试；workspace 保存/export integration 待补 |
| IO-003 | 格式兼容 | TSJ 读取与写入 | DOM-004, DOM-006 | 开发中 | 已在 `@pixel-editor/tiled-json` 增加 TSJ 读取/写出：覆盖 image / image-collection tileset、tile metadata、animation、collision objectgroup、基础 wang set 与 deterministic writer，并已接入 controller 级 tileset import API 与回归测试；更完整的 TSJ 兼容字段与保存链路待补 |
| IO-004 | 格式兼容 | TMX 读取 | DOM-002, DOM-003, DOM-004, DOM-005, DOM-006 | 未开始 | XML map 读取 |
| IO-005 | 格式兼容 | TMX 写入 | IO-004 | 未开始 | 保留兼容关键元数据 |
| IO-006 | 格式兼容 | TSX 读取与写入 | DOM-004, DOM-006 | 未开始 | XML tileset 读写 |
| IO-007 | 格式兼容 | 资源路径解析与引用管理 | DOM-004, DOM-008 | 未开始 | 处理相对路径、外部 tileset、模板引用 |
| IO-008 | 格式兼容 | 兼容性校验与问题报告 | IO-001, IO-004, IO-007 | 未开始 | 对未知字段和不支持能力给出 issue |
| REN-001 | 渲染 | Pixi 渲染器启动与宿主接口 | FND-004, DOM-002 | 开发中 | 已接入真实 Pixi application 与 renderer host |
| REN-002 | 渲染 | Camera 与 viewport 控制 | REN-001, SES-004 | 开发中 | 已接入 zoom 与 pan 基础命令流和视口状态联动 |
| REN-003 | 渲染 | Orthogonal Tile Layer 渲染 | REN-001, DOM-003, DOM-004 | 开发中 | 已实现 orthogonal 网格内 tile cell 可视化与 active layer 高亮 |
| REN-004 | 渲染 | Grid 与 Selection Overlay | REN-002, SES-002 | 开发中 | 已实现 grid overlay 与 tile selection overlay |
| REN-005 | 渲染 | Picking 与命中测试 | REN-002, DOM-003, DOM-005 | 开发中 | 已实现 canvas tile picking 并接入编辑动作分发 |
| REN-006 | 渲染 | Infinite Map Chunk 增量渲染 | REN-003, DOM-007 | 未开始 | 支持 chunk dirty update |
| REN-007 | 渲染 | Isometric 渲染与拾取 | REN-005, DOM-002 | 未开始 | 非正交支持第一项 |
| REN-008 | 渲染 | Staggered 渲染与拾取 | REN-005, DOM-002 | 未开始 | 覆盖 stagger axis/index |
| REN-009 | 渲染 | Hexagonal 渲染与拾取 | REN-005, DOM-002 | 未开始 | 覆盖 hex side length |
| REN-010 | 渲染 | Oblique 渲染与拾取 | REN-005, DOM-002 | 未开始 | 覆盖 skewx/skewy |
| REN-011 | 渲染 | Object Layer 渲染 | REN-005, DOM-005 | 开发中 | 已支持 object layer 基础可视化、selected state 与 shape-aware canvas picking；tile/text 视觉保真与 transform handles 待补 |
| REN-012 | 渲染 | Image Layer 与 Group Layer 渲染 | REN-003, DOM-003 | 未开始 | 覆盖层级组合 |
| REN-013 | 渲染 | Parallax、Tint、Blend Mode | REN-012, DOM-003 | 未开始 | 必须对齐 Tiled 图层视觉语义 |
| REN-014 | 渲染 | Minimap | REN-003, REN-011 | 未开始 | 支持地图预览与导航 |
| UI-001 | Web 壳 | 编辑器主布局 | FND-004, SES-001 | 开发中 | 已实现 Tiled 风格的 editor shell：左侧 `Project / Properties` 双 dock、右侧双 dock stack 与底部 status bar 骨架，去除 news 按钮；UI shell 仍仅通过注入的 `EditorController` 通信 |
| UI-002 | Web 壳 | 项目路由与编辑页入口 | FND-004 | 开发中 | 已实现 `/projects/[projectId]` 页面与 web-host 装配层，当前从 `examples/` 加载示例项目 seed，UI 不再直接绑定 demo store |
| UI-003 | Web 壳 | Toolbar 与工具切换 | UI-001, SES-003 | 开发中 | 已按 Tiled 的 main/tools/tool-options 三段结构重建顶部 toolbar，并按 `mainwindow.ui` / `mainwindow.cpp` 接入 File/Edit/View/World/Map/Layer/Project/Help 菜单层级、可见性、文案与快捷键展示；现有工具切换、New split button 与 shape fill tool options 已接通，未实现动作仍保留禁用占位 |
| UI-004 | Web 壳 | Layers Panel | UI-001, DOM-003 | 开发中 | 已收敛为 Tiled 风格的 layer dock：反向层级列表、图层类型图标、visible/locked 状态列与底部工具条；当前已接通选择、新建、删除、重排，visibility/lock/duplicate/highlight 交互待后续 `LYR-003` 补齐 |
| UI-005 | Web 壳 | Properties Inspector | UI-001, DOM-006 | 开发中 | 已接入 Map / Layer / Object 基础 inspector 编辑与 primitive + enum + class + object reference custom properties editor，并将左侧 Properties 收成连续 property rows、移除分段 Apply、改为字段 blur/change 即提交的 controller/command 链路；Custom Properties 已补齐紧凑列表、底部工具条、单项选择与内联新增/重命名编辑，更完整的 property browser 细节待补 |
| UI-006 | Web 壳 | Tilesets Panel | UI-001, DOM-004 | 开发中 | 已接入真实 asset preview、tile stamp 选择、tileset 创建、参数编辑与 tile 属性面板 |
| UI-007 | Web 壳 | Objects Panel | UI-001, DOM-005 | 开发中 | 已支持 active object layer 的对象列表、选择、object clipboard 与画布拾取联动；检索与属性面板待补 |
| UI-008 | Web 壳 | Command Palette / Action Search | UI-001 | 未开始 | 对齐 Tiled action search 能力 |
| UI-009 | Web 壳 | Issues Panel | UI-001, IO-008 | 未开始 | 展示兼容与校验问题 |
| MAP-001 | 地图编辑 | New Map 流程 | UI-001, DOM-002, CMD-001 | 开发中 | 已接入 quick create map 与默认图层初始化 |
| MAP-002 | 地图编辑 | Map Properties 编辑 | MAP-001, DOM-002 | 已完成 | 已支持 name、orientation、render order、尺寸、infinite 与 background color 编辑 |
| MAP-003 | 地图编辑 | Tile Layer 新增/删除/重排 | MAP-001, DOM-003, CMD-001 | 开发中 | 已支持顶层 tile/object layer 管理，group 内部层级调整待实现 |
| MAP-004 | 地图编辑 | Stamp Brush | REN-003, SES-003, CMD-001 | 开发中 | 已支持 tileset panel 真实 asset preview 选取 stamp、拖拽连续绘制与单次 stroke undo |
| MAP-005 | 地图编辑 | Eraser | MAP-004 | 已完成 | 已支持点击与拖拽擦除，并通过 controller stroke 单元测试 |
| MAP-006 | 地图编辑 | Bucket Fill | MAP-004 | 已完成 | 已支持 finite map flood fill，并按 Tiled 语义将 infinite map 填充限制在当前 tile layer bounds；已补 domain/map/controller 测试 |
| MAP-007 | 地图编辑 | Shape Fill | MAP-004 | 已完成 | 已支持 rectangle / ellipse 模式、拖拽预览、Shift 等比约束与 Alt 中心绘制；临时预览态已收敛到 `editor-state` 的 interaction slice，不再由 controller 私有字段承载，并通过 domain/map/controller 测试 |
| MAP-008 | 地图编辑 | Tile Selection | MAP-004, SES-002 | 已完成 | 已支持 tile 区域框选预览、提交选区、从选区 capture pattern stamp，并通过 editor-state/map/controller 测试 |
| MAP-009 | 地图编辑 | Clipboard | MAP-008, CMD-001 | 开发中 | 已支持 tile selection 与 object selection 的 copy、cut、paste，clipboard 为显式 runtime/session state；standalone property clipboard 待补全 |
| MAP-010 | 地图编辑 | Undo/Redo UI 接入 | CMD-002, UI-003 | 开发中 | 已接入基础 undo/redo 按钮与 history 状态 |
| MAP-011 | 地图编辑 | Infinite Map 编辑 | DOM-007, MAP-004, MAP-006, REN-006 | 未开始 | chunk 扩张与转换 |
| OBJ-001 | 对象编辑 | Object Layer 管理 | MAP-003, DOM-005 | 开发中 | 已支持 active object layer 下的对象列表、面板/画布选择、创建与删除最小闭环；绘制顺序待补 |
| OBJ-002 | 对象编辑 | Rectangle / Ellipse / Point | OBJ-001, CMD-001, REN-011 | 开发中 | 已支持 rectangle object 的最小创建与 clipboard 流，ellipse / point 已具备渲染与命中测试基础；画布编辑待补 |
| OBJ-003 | 对象编辑 | Polygon / Polyline | OBJ-001, CMD-001, REN-011 | 未开始 | 点编辑与路径编辑 |
| OBJ-004 | 对象编辑 | Text Object | OBJ-001, DOM-005 | 未开始 | 文本样式与内容编辑 |
| OBJ-005 | 对象编辑 | Tile Object | OBJ-001, DOM-004, REN-011 | 未开始 | tile 作为 object |
| OBJ-006 | 对象编辑 | Capsule Object | OBJ-001, DOM-005 | 未开始 | 对齐 Tiled capsule 对象能力 |
| OBJ-007 | 对象编辑 | Move / Resize / Rotate / Snap | OBJ-002, OBJ-003, OBJ-004, OBJ-005, OBJ-006 | 开发中 | 对象拖拽移动与网格吸附已完成，并通过 `npm run typecheck`、`npm test`、`npm run lint` 验证；resize / rotate 待补 |
| OBJ-008 | 对象编辑 | 对象排序与分组移动 | OBJ-001, CMD-003 | 未开始 | 支持 raise/lower 等操作 |
| OBJ-009 | 对象编辑 | Object Reference 属性 | DOM-006, OBJ-001 | 未开始 | 属性面板可引用对象 |
| TSET-001 | Tileset | 新建 sprite sheet tileset | DOM-004, UI-006 | 开发中 | 已支持基础创建流、自动切 tile、挂载到当前 map 与后续参数编辑，待补上传 |
| TSET-002 | Tileset | 新建 image collection tileset | DOM-004, UI-006 | 开发中 | 已支持基础创建流、挂载到当前 map 与属性编辑链路，待补批量导入与排序 |
| TSET-003 | Tileset | Tileset 参数编辑 | TSET-001, TSET-002, CMD-001 | 已完成 | 已支持 name、tile size、tile offset、alignment、render size、fill mode 与 sprite source 参数编辑，并通过命令/控制器测试 |
| TSET-004 | Tileset | Tile 属性编辑 | TSET-003, DOM-006 | 开发中 | 已支持 tile class 与 primitive + enum + class + object reference custom properties 编辑，并将 Tile Properties 收成连续 property rows、移除 Apply 元数据按钮、接入紧凑 custom properties browser；property browser 细节与高级 tile 元数据待补 |
| TSET-005 | Tileset | Tile Probability | TSET-004 | 已完成 | 已在 Tile Properties 中接入概率 property row、即时提交与 controller/domain 测试链路，为 random mode 提供 tile 权重元数据 |
| TSET-006 | Tileset | Typed Tiles | TSET-004, DOM-006 | 已完成 | 已接入 tile class 对应的 suggested/inherited properties 解析、显式属性覆盖合并、继承属性在 Tile Properties 中的展示与覆写编辑，并通过 domain/seed 测试链路验证 |
| TSET-007 | Tileset | Tile Animation Editor | TSET-003 | 已完成 | 已接入 Tiled 风格的 tile animation editor 对话框，支持 frame 列表、拖拽重排、duration 应用与 tileset 选帧，并通过 `npm run typecheck`、`npm test`、`npm run lint` 验证 |
| TSET-008 | Tileset | Tile Collision Editor | TSET-003, OBJ-001 | 已完成 | 已接入独立 tile collision editor 对话框，支持 collision object 的创建、列表选择、画布拖拽移动、层级调整、基础属性与自定义属性编辑，并通过 `npm run typecheck`、`npm test`、`npm run lint` 验证 |
| TSET-009 | Tileset | Wang Set 基础模型接入 | DOM-004, DOM-006 | 已完成 | 已接入 tileset 级 Wang set 数据/命令/控制器链路，支持 Terrain Sets dock 的创建、重命名、类型切换、删除，以及菜单/tileset 工具条入口，并通过 `npm run typecheck`、`npm test`、`npm run lint` 验证 |
| LYR-001 | 高级图层 | Image Layer | DOM-003, REN-012 | 未开始 | 包含 repeatx/repeaty |
| LYR-002 | 高级图层 | Group Layer | DOM-003, REN-012 | 未开始 | 树形组织与继承属性 |
| LYR-003 | 高级图层 | Offset / Opacity / Visibility / Lock | DOM-003, UI-004 | 未开始 | 图层基础展示控制 |
| LYR-004 | 高级图层 | Tint Color | LYR-001, LYR-002, REN-013 | 未开始 | 递归影响 child layers |
| LYR-005 | 高级图层 | Blend Mode | LYR-001, LYR-002, REN-013 | 未开始 | 对齐 Tiled 支持列表 |
| LYR-006 | 高级图层 | Parallax | LYR-001, LYR-002, REN-013 | 未开始 | map parallax origin + layer factors |
| ADV-001 | 高级绘制 | Tile Stamp Memory | MAP-008, TSET-005 | 未开始 | stamp variations 与 probability |
| ADV-002 | 高级绘制 | Random Mode | ADV-001, TSET-005 | 未开始 | 依赖 tile probability |
| ADV-003 | 高级绘制 | Terrain / Wang Brush | TSET-009, ADV-001 | 未开始 | 自动匹配边/角地形 |
| ADV-004 | 高级绘制 | Select Same Tile / Magic Wand | MAP-008, REN-005 | 未开始 | 选择增强工具 |
| PROJ-001 | 项目 | Project 文件读写 | DOM-008, IO-007 | 未开始 | 项目元数据落盘 |
| PROJ-002 | 项目 | 资源树与项目视图 | PROJ-001, UI-001 | 未开始 | 浏览项目资产 |
| PROJ-003 | 项目 | Custom Property Types Editor | DOM-006, PROJ-001, UI-005 | 未开始 | enum/class 类型定义 |
| PROJ-004 | 项目 | 兼容版本与导出选项 | PROJ-001 | 未开始 | 保存兼容目标与导出偏好 |
| TMPL-001 | 模板 | 模板创建与保存 | DOM-009, OBJ-001, IO-007 | 未开始 | object template 文件支持 |
| TMPL-002 | 模板 | 模板实例化 | TMPL-001, OBJ-001 | 未开始 | 替换对象为模板实例 |
| TMPL-003 | 模板 | 模板重置与脱离 | TMPL-002, CMD-001 | 未开始 | reset / detach instance |
| WORLD-001 | 世界 | World 文件读写 | DOM-010, IO-007 | 未开始 | `.world` 支持 |
| WORLD-002 | 世界 | World 视图与地图定位 | WORLD-001, REN-002 | 未开始 | 多地图展示与导航 |
| AUTO-001 | 自动映射 | Rules 文件解析 | IO-007, DOM-008 | 未开始 | `rules.txt` 与单 rule map |
| AUTO-002 | 自动映射 | Rule Map 执行引擎 | AUTO-001, DOM-003, DOM-007 | 未开始 | 输入输出模式匹配 |
| AUTO-003 | 自动映射 | Manual AutoMap | AUTO-002, UI-003 | 未开始 | 手动触发 automap |
| AUTO-004 | 自动映射 | AutoMap While Drawing | AUTO-002, MAP-004 | 未开始 | 绘制过程中自动应用规则 |
| EXP-001 | 导出 | 原生格式保存流程 | IO-002, IO-003, IO-005, IO-006 | 未开始 | map、tileset、template、world 保存 |
| EXP-002 | 导出 | JSON 导出 | EXP-001 | 未开始 | 面向 TMJ/TSJ 目标输出 |
| EXP-003 | 导出 | Image Export | REN-003, REN-011, LYR-006 | 未开始 | 导出整图像 |
| EXP-004 | 导出 | Export Options | EXP-001, PROJ-004 | 未开始 | 包括 embed tilesets 等选项 |
| EXP-005 | 导出 | Export Job Pipeline | FND-005, EXP-001 | 未开始 | 交由 worker 执行 |
| QA-001 | 质量保障 | Domain 单元测试基线 | DOM-002, DOM-003, DOM-004, DOM-005, DOM-006 | 开发中 | 已接入 Vitest，并覆盖 map 基础不变量 |
| QA-002 | 质量保障 | Command 单元测试基线 | CMD-001, CMD-002 | 开发中 | 已覆盖 execute/undo/redo/merge 及 tile stroke 聚合基础行为 |
| QA-003 | 质量保障 | 格式 Round-trip Fixture 测试 | IO-001, IO-002, IO-004, IO-005 | 未开始 | 对照 Tiled fixtures |
| QA-004 | 质量保障 | 渲染截图回归测试 | REN-003, REN-007, REN-008, REN-009, REN-010 | 未开始 | 各 orientation 回归 |
| QA-005 | 质量保障 | Web E2E 测试 | UI-001, MAP-004, OBJ-002, EXP-001 | 未开始 | 基础操作链路验证 |
| EXT-001 | 扩展体系 | 扩展宿主接口 | FND-005, PROJ-001 | 未开始 | 二期能力 |
| EXT-002 | 扩展体系 | 自定义导出格式扩展点 | EXT-001, EXP-005 | 未开始 | 对齐 Tiled script/export 思路 |
| EXT-003 | 扩展体系 | 命令与工具扩展点 | EXT-001, UI-003, CMD-001 | 未开始 | 注册工具与命令 |
| EXT-004 | 扩展体系 | 脚本执行桥接 | EXT-001, PROJ-001 | 未开始 | 二期能力，非当前实现阻塞项 |

## Current Summary

当前以 `Feature Tracker` 表格为唯一真源。

在引入自动统计脚本之前，不维护手工汇总数量，避免表项调整后出现状态统计失真。

## Immediate Focus

当前应优先推进以下功能，保持依赖顺序正确：

1. `DOM-001` 到 `DOM-010` 领域模型细化与不变量补全
2. `SES-001` 到 `SES-004` 状态选择器与应用服务扩展
3. `REN-002` 到 `REN-005` 从基础可视化推进到真实 tile 编辑渲染
4. `UI-004` 到 `UI-007` 图层、属性、tileset 与 object 面板细化
5. `MAP-002` 到 `MAP-004` 地图属性、图层操作与 stamp brush
6. `IO-001` 到 `IO-003` TMJ/TSJ 兼容层起步
