# HuLa MCP 服务

HuLa MCP 服务是基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io) 的服务端实现，为 HuLa 即时通讯应用提供上下文和功能支持。

## 项目介绍

本服务使用 TypeScript 实现，基于 MCP SDK 开发，为 HuLa 即时通讯应用提供以下功能：

- **资源访问**：提供用户信息、群组信息、聊天记录等资源的访问
- **工具操作**：提供发送消息、创建群组、搜索内容等功能
- **上下文管理**：为大语言模型（LLM）提供结构化的上下文信息

## 技术栈

- TypeScript
- Express.js
- Model Context Protocol SDK
- Zod（用于类型验证）

## 安装与运行

### 从NPM安装

```bash
# 全局安装
npm install -g hula-mcp-server
# 或使用 pnpm
pnpm add -g hula-mcp-server
```

### 本地开发安装

```bash
# 安装依赖
npm install
# 或使用 pnpm
pnpm install
```

### 开发模式运行

```bash
npm run dev
# 或使用 pnpm
pnpm run dev
```

### 构建与生产环境运行

```bash
# 构建项目
npm run build
# 或使用 pnpm
pnpm run build

# 运行生产环境
npm run start
# 或使用 pnpm
pnpm run start
```

### 使用CLI工具

如果你全局安装了hula-mcp-server，可以使用以下命令：

```bash
# 启动MCP服务
hula-mcp start

# 指定端口启动
hula-mcp start --port 3200

# 设置集成到Cursor
hula-mcp setup http://localhost:3100 --client cursor

# 设置集成到Windsurf
hula-mcp setup http://localhost:3100 --client windsurf
```

## 项目结构

```
mcp-server/
├── src/
│   ├── resources/       # MCP 资源定义
│   │   ├── chat.ts      # 聊天相关资源
│   │   ├── group.ts     # 群组相关资源
│   │   └── user.ts      # 用户相关资源
│   ├── tools/           # MCP 工具定义
│   │   └── index.ts     # 工具集合
│   ├── types.ts         # 类型定义
│   ├── cli.ts           # 命令行工具
│   └── index.ts         # 入口文件
├── package.json         # 项目配置
└── tsconfig.json        # TypeScript 配置
```

## API 说明

### 资源 (Resources)

MCP 资源类似于 REST API 中的 GET 端点，用于提供数据：

#### 用户资源

- `users://list` - 获取所有用户列表
- `users://{userId}` - 获取特定用户详情
- `users://online` - 获取在线用户列表
- `users://search?q={query}` - 搜索用户
- `users://{userId}/conversations` - 获取用户的所有会话
- `users://{userId}/unread` - 获取用户的未读消息数
- `users://{userId}/groups` - 获取用户所在的群组

#### 群组资源

- `groups://list` - 获取所有群组列表
- `groups://{groupId}` - 获取特定群组详情
- `groups://{groupId}/members` - 获取群组成员
- `groups://{groupId}/recent-messages` - 获取群组的最近消息

#### 聊天资源

- `conversations://{conversationId}/messages` - 获取特定会话的消息

### 工具 (Tools)

MCP 工具类似于 REST API 中的 POST 端点，用于执行操作：

- `send-message` - 发送消息
- `mark-message-read` - 标记消息为已读
- `create-group` - 创建群组
- `search-messages` - 搜索消息
- `update-user-status` - 更新用户状态

## 与 AI 助手集成

HuLa MCP 服务可以与支持 MCP 的 AI 助手集成，如 Cursor 和 Windsurf。

### 发布到 NPM

要将 HuLa MCP 服务发布到 NPM，请按照以下步骤操作：

1. 确保你有 NPM 账号，并已登录：

```bash
npm login
```

2. 构建并发布包：

```bash
# 构建项目
npm run build

# 发布到 NPM
npm publish
```

### 集成到 Cursor

有两种方式可以将 HuLa MCP 服务集成到 Cursor：

#### 方式一：使用 CLI 工具

```bash
# 全局安装 hula-mcp-server
npm install -g hula-mcp-server

# 启动 MCP 服务
hula-mcp start

# 在另一个终端窗口中设置集成
hula-mcp setup http://localhost:3100 --client cursor
```

#### 方式二：手动集成

1. 启动 MCP 服务：

```bash
npm run start
# 或使用 pnpm
pnpm run start
```

2. 创建配置文件：

在 `~/.cursor/mcp/` 目录下创建 `mcp-config.json` 文件：

```json
{
  "name": "HuLa-MCP",
  "version": "1.0.0",
  "description": "HuLa即时通讯应用的MCP服务",
  "baseUrl": "http://localhost:3100",
  "endpoints": {
    "sse": "/sse",
    "messages": "/messages"
  }
}
```

### 集成到 Windsurf

同样有两种方式可以将 HuLa MCP 服务集成到 Windsurf：

#### 方式一：使用 CLI 工具

```bash
# 全局安装 hula-mcp-server
npm install -g hula-mcp-server

# 启动 MCP 服务
hula-mcp start

# 在另一个终端窗口中设置集成
hula-mcp setup http://localhost:3100 --client windsurf
```

#### 方式二：手动集成

1. 启动 MCP 服务：

```bash
npm run start
# 或使用 pnpm
pnpm run start
```

2. 创建配置文件：

在 `~/.windsurf/mcp/` 目录下创建 `mcp-config.json` 文件：

```json
{
  "name": "HuLa-MCP",
  "version": "1.0.0",
  "description": "HuLa即时通讯应用的MCP服务",
  "baseUrl": "http://localhost:3100",
  "endpoints": {
    "sse": "/sse",
    "messages": "/messages"
  }
}
```

## 开发说明

### 添加新资源

要添加新的资源，请在 `src/resources` 目录下创建或修改相应的文件，并使用 `server.resource()` 方法注册资源。

### 添加新工具

要添加新的工具，请在 `src/tools/index.ts` 文件中使用 `server.tool()` 方法注册工具。

## 贡献指南

欢迎贡献代码、报告问题或提出改进建议。请遵循以下步骤：

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 许可证

本项目采用 Apache 2.0 许可证 - 详情请参阅 [LICENSE](../LICENSE) 文件。
