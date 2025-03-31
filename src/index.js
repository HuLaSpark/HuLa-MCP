import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

// 创建Express应用
const app = express();
app.use(cors());
app.use(express.json());

// 设置端口
const PORT = process.env.PORT || 3100;

// 模拟数据
const mockUsers = [
  { id: 'user-1', name: '张三', avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=1', status: 'online' },
  { id: 'user-2', name: '李四', avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=2', status: 'online' },
  { id: 'user-3', name: '王五', avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=3', status: 'offline' }
];

const mockGroups = [
  { id: 'group-1', name: '项目讨论组', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=1', members: ['user-1', 'user-2', 'user-3'] }
];

const mockMessages = [
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
];

const mockConversations = [
  {
    id: 'conv-1',
    participants: ['user-1', 'user-2'],
    lastMessage: mockMessages[1],
    unreadCount: 0,
    isGroup: false
  },
  {
    id: 'conv-2',
    participants: ['user-1', 'user-3'],
    lastMessage: undefined,
    unreadCount: 0,
    isGroup: false
  },
  {
    id: 'conv-3',
    participants: ['user-1', 'user-2', 'user-3'],
    lastMessage: mockMessages[2],
    unreadCount: 1,
    isGroup: true,
    groupId: 'group-1'
  }
];

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'HuLa MCP服务正在运行' });
});

// SSE连接端点
app.get('/sse', (req, res) => {
  // 设置SSE头部
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // 发送初始消息
  res.write('event: hello\n');
  res.write('data: {"message": "HuLa MCP服务已连接"}\n\n');
  
  // 保持连接活跃
  const interval = setInterval(() => {
    res.write('event: ping\n');
    res.write('data: {}\n\n');
  }, 30000);
  
  // 客户端断开连接时清理
  req.on('close', () => {
    clearInterval(interval);
  });
});

// 消息处理端点
app.post('/messages', (req, res) => {
  const { type, data } = req.body;
  
  // 处理不同类型的消息
  switch (type) {
    case 'resource':
      handleResourceRequest(data, res);
      break;
    case 'tool':
      handleToolRequest(data, res);
      break;
    default:
      res.status(400).json({ error: '不支持的消息类型' });
  }
});

// 处理资源请求
function handleResourceRequest(data, res) {
  const { uri } = data;
  
  try {
    const url = new URL(uri);
    const path = url.pathname;
    
    // 根据URI路径返回相应的资源
    if (path.startsWith('/users')) {
      if (path.endsWith('/conversations')) {
        const userId = path.split('/')[2];
        const userConversations = mockConversations.filter(conv => 
          conv.participants.includes(userId)
        );
        res.json({ contents: [{ uri, text: JSON.stringify(userConversations) }] });
      } else if (path.endsWith('/unread')) {
        const userId = path.split('/')[2];
        const unreadCount = mockConversations
          .filter(conv => conv.participants.includes(userId))
          .reduce((total, conv) => total + conv.unreadCount, 0);
        res.json({ contents: [{ uri, text: JSON.stringify({ userId, unreadCount }) }] });
      } else {
        // 用户列表或用户详情
        const segments = path.split('/');
        if (segments.length > 2) {
          const userId = segments[2];
          const user = mockUsers.find(u => u.id === userId);
          if (user) {
            res.json({ contents: [{ uri, text: JSON.stringify(user) }] });
          } else {
            res.status(404).json({ error: '用户不存在' });
          }
        } else {
          res.json({ contents: [{ uri, text: JSON.stringify(mockUsers) }] });
        }
      }
    } else if (path.startsWith('/groups')) {
      if (path.endsWith('/recent-messages')) {
        const groupId = path.split('/')[2];
        const recentMessages = mockMessages
          .filter(msg => msg.isGroup && msg.receiverId === groupId)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 10);
        res.json({ contents: [{ uri, text: JSON.stringify(recentMessages) }] });
      } else {
        // 群组列表或群组详情
        const segments = path.split('/');
        if (segments.length > 2) {
          const groupId = segments[2];
          const group = mockGroups.find(g => g.id === groupId);
          if (group) {
            res.json({ contents: [{ uri, text: JSON.stringify(group) }] });
          } else {
            res.status(404).json({ error: '群组不存在' });
          }
        } else {
          res.json({ contents: [{ uri, text: JSON.stringify(mockGroups) }] });
        }
      }
    } else if (path.startsWith('/conversations')) {
      if (path.includes('/messages')) {
        const conversationId = path.split('/')[2];
        const conversation = mockConversations.find(conv => conv.id === conversationId);
        
        if (!conversation) {
          res.json({ contents: [{ uri, text: JSON.stringify([]) }] });
          return;
        }
        
        // 找出这个会话中的所有消息
        const conversationMessages = mockMessages.filter(msg => {
          if (conversation.isGroup) {
            return msg.isGroup && msg.receiverId === conversation.groupId;
          } else {
            return !msg.isGroup && 
              conversation.participants.includes(msg.senderId) && 
              conversation.participants.includes(msg.receiverId);
          }
        });
        
        res.json({ contents: [{ uri, text: JSON.stringify(conversationMessages) }] });
      } else {
        // 会话列表或会话详情
        const segments = path.split('/');
        if (segments.length > 2) {
          const conversationId = segments[2];
          const conversation = mockConversations.find(c => c.id === conversationId);
          if (conversation) {
            res.json({ contents: [{ uri, text: JSON.stringify(conversation) }] });
          } else {
            res.status(404).json({ error: '会话不存在' });
          }
        } else {
          res.json({ contents: [{ uri, text: JSON.stringify(mockConversations) }] });
        }
      }
    } else {
      res.status(404).json({ error: '资源不存在' });
    }
  } catch (error) {
    res.status(400).json({ error: '无效的URI' });
  }
}

// 处理工具请求
function handleToolRequest(data, res) {
  const { name, parameters } = data;
  
  switch (name) {
    case 'send-message':
      // 发送消息工具
      const { content, senderId, receiverId, isGroup } = parameters;
      const newMessage = {
        id: `msg-${Date.now()}`,
        content,
        senderId,
        receiverId,
        type: 'text',
        timestamp: new Date(),
        isRead: false,
        isGroup: !!isGroup
      };
      
      mockMessages.push(newMessage);
      
      // 更新会话的最后一条消息
      let conversation;
      if (isGroup) {
        conversation = mockConversations.find(c => c.isGroup && c.groupId === receiverId);
      } else {
        conversation = mockConversations.find(c => 
          !c.isGroup && 
          c.participants.includes(senderId) && 
          c.participants.includes(receiverId)
        );
      }
      
      if (conversation) {
        conversation.lastMessage = newMessage;
        conversation.unreadCount += 1;
      }
      
      res.json({ result: { success: true, messageId: newMessage.id } });
      break;
      
    case 'mark-as-read':
      // 标记消息为已读工具
      const { messageIds } = parameters;
      
      if (Array.isArray(messageIds)) {
        messageIds.forEach(id => {
          const message = mockMessages.find(m => m.id === id);
          if (message) {
            message.isRead = true;
          }
        });
        
        // 更新会话的未读计数
        mockConversations.forEach(conv => {
          if (conv.participants.includes(userId)) {
            conv.unreadCount = 0;
          }
        });
        
        res.json({ result: { success: true } });
      } else {
        res.status(400).json({ error: '无效的消息ID列表' });
      }
      break;
      
    case 'create-group':
      // 创建群组工具
      const { name: groupName, members } = parameters;
      
      if (groupName && Array.isArray(members) && members.length > 0) {
        const newGroup = {
          id: `group-${Date.now()}`,
          name: groupName,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${Date.now()}`,
          members
        };
        
        mockGroups.push(newGroup);
        
        // 创建对应的会话
        const newConversation = {
          id: `conv-${Date.now()}`,
          participants: members,
          lastMessage: undefined,
          unreadCount: 0,
          isGroup: true,
          groupId: newGroup.id
        };
        
        mockConversations.push(newConversation);
        
        res.json({ result: { success: true, groupId: newGroup.id, conversationId: newConversation.id } });
      } else {
        res.status(400).json({ error: '无效的群组名称或成员列表' });
      }
      break;
      
    case 'search-messages':
      // 搜索消息工具
      const { query, userId } = parameters;
      
      if (query && userId) {
        // 查找用户参与的所有会话
        const userConversations = mockConversations.filter(conv => 
          conv.participants.includes(userId)
        );
        
        // 在这些会话中搜索消息
        const results = [];
        userConversations.forEach(conv => {
          let messages;
          if (conv.isGroup) {
            messages = mockMessages.filter(msg => 
              msg.isGroup && msg.receiverId === conv.groupId
            );
          } else {
            messages = mockMessages.filter(msg => 
              !msg.isGroup && 
              conv.participants.includes(msg.senderId) && 
              conv.participants.includes(msg.receiverId)
            );
          }
          
          // 查找包含查询词的消息
          const matchingMessages = messages.filter(msg => 
            msg.content.toLowerCase().includes(query.toLowerCase())
          );
          
          results.push(...matchingMessages);
        });
        
        res.json({ result: { success: true, messages: results } });
      } else {
        res.status(400).json({ error: '无效的查询参数' });
      }
      break;
      
    default:
      res.status(400).json({ error: '不支持的工具' });
  }
}

// 启动服务器
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 HuLa MCP服务已启动，端口: ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`SSE连接: http://localhost:${PORT}/sse`);
});

export default server;
