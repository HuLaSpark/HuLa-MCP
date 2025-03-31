import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import { json } from 'express';

// 在ESM模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建Express应用
const app = express();
const port = process.env.PORT || 3100;

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(json());

// 提供静态文件
app.use(express.static(path.join(__dirname, '..')));

// 模拟数据
const mockData = {
  // 用户数据
  users: [
    { id: 'user-1', username: 'alice', nickname: 'Alice', status: 'online', avatar: 'https://via.placeholder.com/150' },
    { id: 'user-2', username: 'bob', nickname: 'Bob', status: 'online', avatar: 'https://via.placeholder.com/150' },
    { id: 'user-3', username: 'charlie', nickname: 'Charlie', status: 'offline', avatar: 'https://via.placeholder.com/150' },
    { id: 'user-4', username: 'david', nickname: 'David', status: 'away', avatar: 'https://via.placeholder.com/150' }
  ],
  
  // 群组数据
  groups: [
    { 
      id: 'group-1', 
      name: '项目讨论组', 
      description: '讨论项目进展和问题', 
      avatar: 'https://via.placeholder.com/150',
      createdBy: 'user-1',
      createdAt: new Date('2023-01-01'),
      members: ['user-1', 'user-2', 'user-3']
    },
    { 
      id: 'group-2', 
      name: '闲聊群', 
      description: '日常闲聊', 
      avatar: 'https://via.placeholder.com/150',
      createdBy: 'user-2',
      createdAt: new Date('2023-02-15'),
      members: ['user-1', 'user-2', 'user-4']
    }
  ],
  
  // 消息数据
  messages: [
    {
      id: 'msg-1',
      content: '你好，最近怎么样？',
      senderId: 'user-1',
      receiverId: 'user-2',
      type: 'text',
      timestamp: new Date('2023-03-01T10:00:00'),
      isRead: true,
      isGroup: false
    },
    {
      id: 'msg-2',
      content: '我很好，谢谢关心！',
      senderId: 'user-2',
      receiverId: 'user-1',
      type: 'text',
      timestamp: new Date('2023-03-01T10:05:00'),
      isRead: true,
      isGroup: false
    },
    {
      id: 'msg-3',
      content: '大家好，这是一条群消息',
      senderId: 'user-1',
      receiverId: 'group-1',
      type: 'text',
      timestamp: new Date('2023-03-02T09:00:00'),
      isRead: false,
      isGroup: true
    }
  ],
  
  // 会话数据
  conversations: [
    {
      id: 'conv-1',
      participants: ['user-1', 'user-2'],
      lastMessage: {
        id: 'msg-2',
        content: '我很好，谢谢关心！',
        senderId: 'user-2',
        receiverId: 'user-1',
        type: 'text',
        timestamp: new Date('2023-03-01T10:05:00'),
        isRead: true,
        isGroup: false
      },
      unreadCount: 0,
      isGroup: false
    },
    {
      id: 'conv-2',
      participants: ['user-1', 'user-3'],
      lastMessage: null,
      unreadCount: 0,
      isGroup: false
    },
    {
      id: 'conv-3',
      participants: ['user-1', 'user-2', 'user-3'],
      lastMessage: {
        id: 'msg-3',
        content: '大家好，这是一条群消息',
        senderId: 'user-1',
        receiverId: 'group-1',
        type: 'text',
        timestamp: new Date('2023-03-02T09:00:00'),
        isRead: false,
        isGroup: true
      },
      unreadCount: 1,
      isGroup: true,
      groupId: 'group-1'
    }
  ]
};

// 存储会话信息
const sessions = new Map();

// 设置SSE端点
app.get("/sse", (req: Request, res: Response) => {
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // 创建一个唯一的会话ID
  const sessionId = Math.random().toString(36).substring(2, 15);
  
  // 保存会话信息
  sessions.set(sessionId, {
    res: res,
    lastActivity: Date.now()
  });
  
  // 发送hello消息
  res.write(`data: ${JSON.stringify({
    type: 'hello',
    sessionId: sessionId
  })}\n\n`);
  
  // 当连接关闭时清理会话
  req.on('close', () => {
    sessions.delete(sessionId);
    console.log(`会话 ${sessionId} 已关闭`);
  });
});

// 处理消息请求
app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(400).json({ error: '无效的会话ID' });
  }
  
  // 更新最后活动时间
  session.lastActivity = Date.now();
  
  const { type, uri, name, params } = req.body;
  
  try {
    if (type === 'getResource') {
      // 处理获取资源请求
      handleGetResource(uri, res);
    } else if (type === 'callTool') {
      // 处理调用工具请求
      handleCallTool(name, params, res);
    } else {
      res.status(400).json({ error: '不支持的请求类型' });
    }
  } catch (error) {
    console.error('处理请求时出错:', error);
    res.status(500).json({ error: '处理请求时出错' });
  }
});

// 处理获取资源请求
function handleGetResource(uri: string, res: Response) {
  console.log(`获取资源: ${uri}`);
  
  // 用户列表
  if (uri === 'users://list') {
    return res.json({
      contents: [{
        uri: 'users://list',
        text: JSON.stringify(mockData.users)
      }]
    });
  }
  
  // 在线用户
  if (uri === 'users://online') {
    const onlineUsers = mockData.users.filter(user => user.status === 'online');
    return res.json({
      contents: [{
        uri: 'users://online',
        text: JSON.stringify(onlineUsers)
      }]
    });
  }
  
  // 群组列表
  if (uri === 'groups://list') {
    return res.json({
      contents: [{
        uri: 'groups://list',
        text: JSON.stringify(mockData.groups)
      }]
    });
  }
  
  // 用户详情
  if (uri.startsWith('users://') && !uri.includes('/')) {
    const userId = uri.replace('users://', '');
    const user = mockData.users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: `找不到用户: ${userId}` });
    }
    
    return res.json({
      contents: [{
        uri: uri,
        text: JSON.stringify(user)
      }]
    });
  }
  
  // 群组详情
  if (uri.startsWith('groups://') && !uri.includes('/')) {
    const groupId = uri.replace('groups://', '');
    const group = mockData.groups.find(g => g.id === groupId);
    
    if (!group) {
      return res.status(404).json({ error: `找不到群组: ${groupId}` });
    }
    
    return res.json({
      contents: [{
        uri: uri,
        text: JSON.stringify(group)
      }]
    });
  }
  
  // 用户会话
  if (uri.match(/^users:\/\/[\w-]+\/conversations$/)) {
    const userId = uri.split('/')[0].replace('users://', '');
    const userConversations = mockData.conversations.filter(conv => 
      conv.participants.includes(userId)
    );
    
    return res.json({
      contents: [{
        uri: uri,
        text: JSON.stringify(userConversations)
      }]
    });
  }
  
  // 群组成员
  if (uri.match(/^groups:\/\/[\w-]+\/members$/)) {
    const groupId = uri.split('/')[0].replace('groups://', '');
    const group = mockData.groups.find(g => g.id === groupId);
    
    if (!group) {
      return res.status(404).json({ error: `找不到群组: ${groupId}` });
    }
    
    const members = mockData.users.filter(user => group.members.includes(user.id));
    
    return res.json({
      contents: [{
        uri: uri,
        text: JSON.stringify(members)
      }]
    });
  }
  
  // 未读消息数
  if (uri.match(/^users:\/\/[\w-]+\/unread$/)) {
    const userId = uri.split('/')[0].replace('users://', '');
    const unreadCount = mockData.conversations
      .filter(conv => conv.participants.includes(userId))
      .reduce((total, conv) => total + conv.unreadCount, 0);
    
    return res.json({
      contents: [{
        uri: uri,
        text: JSON.stringify({ userId, unreadCount })
      }]
    });
  }
  
  // 未知资源
  return res.status(404).json({ error: `找不到资源: ${uri}` });
}

// 处理调用工具请求
function handleCallTool(name: string, params: any, res: Response) {
  console.log(`调用工具: ${name}，参数:`, params);
  
  // 发送消息
  if (name === 'send-message') {
    const { content, senderId, receiverId, type = 'text', isGroup = false } = params;
    
    if (!content || !senderId || !receiverId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const newMessage = {
      id: `msg-${Date.now()}`,
      content,
      senderId,
      receiverId,
      type,
      timestamp: new Date(),
      isRead: false,
      isGroup
    };
    
    // 添加到消息列表
    mockData.messages.push(newMessage);
    
    // 更新或创建会话
    let conversation = mockData.conversations.find(conv => {
      if (isGroup) {
        return conv.isGroup && conv.groupId === receiverId;
      } else {
        return !conv.isGroup && 
          conv.participants.includes(senderId) && 
          conv.participants.includes(receiverId);
      }
    });
    
    if (conversation) {
      conversation.lastMessage = newMessage;
      conversation.unreadCount += 1;
    } else {
      const newConversation = {
        id: `conv-${Date.now()}`,
        participants: isGroup ? 
          [...mockData.groups.find(g => g.id === receiverId)?.members || []] : 
          [senderId, receiverId],
        lastMessage: newMessage,
        unreadCount: 1,
        isGroup,
        groupId: isGroup ? receiverId : undefined
      };
      
      mockData.conversations.push(newConversation);
    }
    
    return res.json({
      result: {
        success: true,
        message: newMessage
      }
    });
  }
  
  // 标记消息已读
  if (name === 'mark-message-read') {
    const { messageId, userId } = params;
    
    if (!messageId || !userId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const message = mockData.messages.find(m => m.id === messageId);
    
    if (!message) {
      return res.status(404).json({ error: `找不到消息: ${messageId}` });
    }
    
    message.isRead = true;
    
    // 更新会话未读数
    const conversation = mockData.conversations.find(conv => {
      return conv.lastMessage && conv.lastMessage.id === messageId;
    });
    
    if (conversation && conversation.unreadCount > 0) {
      conversation.unreadCount -= 1;
    }
    
    return res.json({
      result: {
        success: true,
        message: '消息已标记为已读'
      }
    });
  }
  
  // 更新用户状态
  if (name === 'update-user-status') {
    const { userId, status } = params;
    
    if (!userId || !status) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const user = mockData.users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: `找不到用户: ${userId}` });
    }
    
    user.status = status;
    
    return res.json({
      result: {
        success: true,
        user
      }
    });
  }
  
  // 搜索消息
  if (name === 'search-messages') {
    const { query, userId, limit = 10 } = params;
    
    if (!query || !userId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const results = mockData.messages
      .filter(msg => 
        (msg.senderId === userId || msg.receiverId === userId) &&
        msg.content.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
    
    return res.json({
      result: {
        success: true,
        messages: results,
        total: results.length
      }
    });
  }
  
  // 未知工具
  return res.status(404).json({ error: `找不到工具: ${name}` });
}

// 处理OPTIONS请求
app.options("*", (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'HuLa-MCP',
    activeSessions: sessions.size
  });
});

// 添加命令行集成信息端点
app.get('/integration', (req, res) => {
  const baseUrl = `http://localhost:${port}`;
  
  res.status(200).json({
    cursor: `npx @modelcontextprotocol/sdk@latest setup "${baseUrl}" --client cursor`,
    windsurf: `npx @modelcontextprotocol/sdk@latest setup "${baseUrl}" --client windsurf`,
    testClient: `${baseUrl}/test-client.html`
  });
});

// 清理过期会话的定时任务
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    // 如果会话超过10分钟没有活动，则删除
    if (now - session.lastActivity > 10 * 60 * 1000) {
      sessions.delete(sessionId);
      console.log(`会话 ${sessionId} 因不活动而过期`);
    }
  }
}, 60 * 1000); // 每分钟检查一次

// 启动服务器
async function startServer() {
  try {
    // 启动服务器
    const server = app.listen(port, () => {
      const serverUrl = `http://localhost:${port}`;
      const testClientUrl = `${serverUrl}/test-client.html`;
      
      console.log(`🚀 HuLa MCP服务已启动，监听端口: ${port}`);
      console.log(`SSE端点: ${serverUrl}/sse`);
      console.log(`消息端点: ${serverUrl}/messages`);
      console.log(`测试客户端: ${testClientUrl}`);
      console.log(`\n集成命令:`);
      console.log(`Cursor: npx @modelcontextprotocol/sdk@latest setup "${serverUrl}" --client cursor`);
      console.log(`Windsurf: npx @modelcontextprotocol/sdk@latest setup "${serverUrl}" --client windsurf`);
      
      // 自动打开测试客户端
      open(testClientUrl).catch(err => {
        console.error('无法自动打开测试客户端:', err);
        console.log('请手动打开测试客户端:', testClientUrl);
      });
    });
    
    // 优雅关闭
    process.on('SIGINT', () => {
      console.log('正在关闭MCP服务器...');
      server.close(() => {
        console.log('MCP服务器已关闭');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('启动MCP服务器时发生错误:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();
