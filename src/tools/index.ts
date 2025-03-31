import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Message } from '../types.js';

// 生成唯一ID的辅助函数
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// 模拟消息存储
let messages: Message[] = [
  {
    id: 'msg-1',
    content: '你好，最近在忙什么？',
    senderId: 'user-1',
    receiverId: 'user-2',
    type: 'text',
    timestamp: new Date('2023-03-20T09:00:00'),
    isRead: true,
    isGroup: false
  },
  // 其他初始消息...
];

/**
 * 注册MCP工具
 * @param server MCP服务器实例
 */
export function registerTools(server: McpServer) {
  // 发送消息工具
  server.tool(
    'send-message',
    {
      content: z.string(),
      senderId: z.string(),
      receiverId: z.string(),
      type: z.enum(['text', 'image', 'file', 'audio', 'video']).default('text'),
      isGroup: z.boolean().default(false)
    },
    async ({ content, senderId, receiverId, type, isGroup }) => {
      // 创建新消息
      const newMessage: Message = {
        id: generateId('msg'),
        content,
        senderId,
        receiverId,
        type,
        timestamp: new Date(),
        isRead: false,
        isGroup
      };
      
      // 在实际应用中，这里应该将消息保存到数据库
      messages.push(newMessage);
      
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify({
            success: true,
            message: '消息发送成功',
            messageId: newMessage.id
          })
        }]
      };
    }
  );

  // 标记消息为已读工具
  server.tool(
    'mark-message-read',
    {
      messageId: z.string(),
      userId: z.string()
    },
    async ({ messageId, userId }) => {
      // 查找消息
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1) {
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: false,
              error: '消息不存在'
            })
          }]
        };
      }
      
      // 检查用户是否有权限标记该消息为已读
      const message = messages[messageIndex];
      if (message.receiverId !== userId && !message.isGroup) {
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: false,
              error: '无权限标记此消息'
            })
          }]
        };
      }
      
      // 标记消息为已读
      messages[messageIndex] = {
        ...message,
        isRead: true
      };
      
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify({
            success: true,
            message: '消息已标记为已读'
          })
        }]
      };
    }
  );

  // 创建群组工具
  server.tool(
    'create-group',
    {
      name: z.string(),
      description: z.string().optional(),
      createdBy: z.string(),
      initialMembers: z.array(z.string()).default([])
    },
    async ({ name, description, createdBy, initialMembers }) => {
      // 在实际应用中，这里应该将群组保存到数据库
      const groupId = generateId('group');
      
      // 确保创建者在成员列表中
      const members = Array.from(new Set([createdBy, ...initialMembers]));
      
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify({
            success: true,
            message: '群组创建成功',
            group: {
              id: groupId,
              name,
              description,
              createdBy,
              createdAt: new Date(),
              members
            }
          })
        }]
      };
    }
  );

  // 搜索消息工具
  server.tool(
    'search-messages',
    {
      query: z.string(),
      userId: z.string(),
      limit: z.number().default(10)
    },
    async ({ query, userId, limit }) => {
      if (!query || query.trim() === '') {
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: false,
              error: '搜索关键词不能为空'
            })
          }]
        };
      }
      
      // 搜索用户相关的消息
      const userMessages = messages.filter(msg => 
        (msg.senderId === userId || msg.receiverId === userId) && 
        msg.content.includes(query)
      );
      
      // 按时间排序并限制结果数量
      const results = [...userMessages]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
      
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify({
            success: true,
            results,
            count: results.length,
            query
          })
        }]
      };
    }
  );

  // 用户状态更新工具
  server.tool(
    'update-user-status',
    {
      userId: z.string(),
      status: z.enum(['online', 'offline', 'away'])
    },
    async ({ userId, status }) => {
      // 在实际应用中，这里应该更新数据库中的用户状态
      
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify({
            success: true,
            message: '用户状态已更新',
            userId,
            status
          })
        }]
      };
    }
  );
}
