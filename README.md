# Pone 工具箱

> 纯本地运行、数据不出浏览器的前端开发者工具集

Pone 是一款 Chrome 扩展（Manifest V3），集成 URL 解析、JSON 查看、Cron 表达式解析、Base64 编解码等常用开发工具，所有计算均在浏览器本地完成，不会向外部发送任何数据。

---

## 功能列表

| 工具 | 说明 |
|------|------|
| **URL 解析** | 解析 URL 各组成部分（协议、主机、端口、路径、锚点等），支持双向编辑与实时重建；查询参数表格支持启用/禁用、编解码、排序、导入导出；URL 链路树可视化展示嵌套 URL 结构；内置历史记录面板（模糊搜索、备注、置顶） |
| **二维码** | 根据当前 URL 实时生成二维码，支持放大预览与 PNG 下载 |
| **JSON 查看** | 树视图展开/折叠、格式化与压缩；JSONPath 表达式查询与语法参考面板；支持树内直接编辑；自动识别图片 URL 和链接并提供快捷跳转 |
| **Cron 解析** | 解析 5 字段 Cron 表达式，展示通俗自然语言描述与下次 N 次运行时间预览；逐字段可视化构建器；常用预设一键载入；语法速查面板 |
| **Base64** | 文本 Base64 编码/解码；支持拖入文件或点击上传直接编码；自动识别图片、JSON、HTML 等结果类型并提供预览 |
| **正则测试**（开发中） | 正则表达式编写与实时匹配测试，支持多种标志位、捕获组展示、替换预览与常用正则预设 |

### 其他特性

- **多主题** — 内置多套配色主题，一键切换
- **国际化** — 支持中文 / English，运行时切换语言
- **纯本地** — 所有逻辑在浏览器内执行，无网络请求，数据零泄露

---

## 安装与开发

### 环境要求

- **Node.js** ≥ 18
- **npm** ≥ 9

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

启动 Vite 开发服务器，支持 HMR 热更新。

### 类型检查

```bash
npm run typecheck
```

仅运行 TypeScript 类型检查，不输出产物。

### 生产构建

```bash
npm run build
```

先执行类型检查，再通过 Vite 打包，产物输出到 `dist/` 目录。

### 预览构建结果

```bash
npm run preview
```

### 加载到 Chrome

1. 执行 `npm run build` 生成 `dist/` 目录
2. 打开 Chrome，进入 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」，选择 `dist/` 目录

---

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | React 18 |
| 构建 | Vite 5 |
| 语言 | TypeScript 5 |
| 状态管理 | Zustand |
| 样式 | CSS + clsx |
| JSON 查询 | jsonpath-plus |
| 二维码生成 | qrcode |

### 项目结构

```
src/
├── components/    # 通用 UI 组件（CollapsibleCard、Dropdown、Input、Modal、Nav、Switch 等）
├── hooks/         # 自定义 Hooks（useClickOutside、useKey）
├── i18n/          # 国际化文案（zh-CN / en-US，ICU MessageFormat）
├── store/         # Zustand 全局状态
├── tools/         # 各工具模块
│   ├── url-parser/
│   ├── json-viewer/
│   ├── cron-parser/
│   ├── base64-tool/
│   └── regex-tester/
├── utils/         # 工具函数（URL 解析、Cron 解析、模糊匹配、主题、历史记录等）
├── App.tsx        # 应用入口与工具注册
└── main.tsx       # 渲染入口
```

---

## License

本项目基于 [MIT License](LICENSE) 开源。

```
MIT License

Copyright (c) 2026 Pone/ariesly
```
