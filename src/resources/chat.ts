import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Message, Conversation } from '../types.js';

// 模拟数据
const mockMessages: Message[] = [
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

const mockConversations: Conversation[] = [
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

// 注册聊天相关资源
export function registerChatResources(server: McpServer) {
  // 用户会话列表
  server.resource(
    'user-conversations',
    new ResourceTemplate('users://{userId}/conversations', { list: undefined }),
    async (uri: URL, params: Record<string, any>) => {
      const userId = params.userId as string;
      const userConversations = mockConversations.filter(conv => 
        conv.participants.includes(userId)
      );
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(userConversations)
        }]
      };
    }
  );

  // 会话消息
  server.resource(
    'conversation-messages',
    new ResourceTemplate('conversations://{conversationId}/messages', { list: undefined }),
    async (uri: URL, params: Record<string, any>) => {
      const conversationId = params.conversationId as string;
      const conversation = mockConversations.find(conv => conv.id === conversationId);
      
      if (!conversation) {
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify([])
          }]
        };
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
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(conversationMessages)
        }]
      };
    }
  );

  // 未读消息数
  server.resource(
    'unread-messages',
    new ResourceTemplate('users://{userId}/unread', { list: undefined }),
    async (uri: URL, params: Record<string, any>) => {
      const userId = params.userId as string;
      const unreadCount = mockConversations
        .filter(conv => conv.participants.includes(userId))
        .reduce((total, conv) => total + conv.unreadCount, 0);
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ userId, unreadCount })
        }]
      };
    }
  );

  // 最近群组消息
  server.resource(
    'recent-group-messages',
    new ResourceTemplate('groups://{groupId}/recent-messages', { list: undefined }),
    async (uri: URL, params: Record<string, any>) => {
      const groupId = params.groupId as string;
      const recentMessages = mockMessages
        .filter(msg => msg.isGroup && msg.receiverId === groupId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(recentMessages)
        }]
      };
    }
  );
}
