import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { User } from '../types.js';

// 模拟数据 - 在实际应用中，这些数据应该从数据库中获取
const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'zhang_san',
    nickname: '张三',
    avatar: 'https://example.com/avatars/user1.png',
    status: 'online',
    lastActive: new Date()
  },
  {
    id: 'user-2',
    username: 'li_si',
    nickname: '李四',
    avatar: 'https://example.com/avatars/user2.png',
    status: 'offline',
    lastActive: new Date('2023-03-15T10:30:00')
  },
  {
    id: 'user-3',
    username: 'wang_wu',
    nickname: '王五',
    avatar: 'https://example.com/avatars/user3.png',
    status: 'away',
    lastActive: new Date('2023-03-20T15:45:00')
  },
  {
    id: 'user-4',
    username: 'zhao_liu',
    nickname: '赵六',
    avatar: 'https://example.com/avatars/user4.png',
    status: 'online',
    lastActive: new Date()
  },
  {
    id: 'user-5',
    username: 'sun_qi',
    nickname: '孙七',
    avatar: 'https://example.com/avatars/user5.png',
    status: 'offline',
    lastActive: new Date('2023-03-18T09:15:00')
  }
];

/**
 * 注册用户相关的MCP资源
 * @param server MCP服务器实例
 */
export function registerUserResources(server: McpServer) {
  // 获取所有用户列表
  server.resource(
    'users-list',
    'users://list',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: JSON.stringify(mockUsers.map(user => ({
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          status: user.status
        })))
      }]
    })
  );

  // 获取特定用户详情
  server.resource(
    'user-detail',
    new ResourceTemplate('users://{userId}', { list: undefined }),
    async (uri, params) => {
      const userId = params.userId as string;
      const user = mockUsers.find(u => u.id === userId);
      
      if (!user) {
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({ error: '用户不存在' })
          }]
        };
      }

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(user)
        }]
      };
    }
  );

  // 获取在线用户
  server.resource(
    'online-users',
    'users://online',
    async (uri) => {
      const onlineUsers = mockUsers.filter(user => user.status === 'online');
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(onlineUsers.map(user => ({
            id: user.id,
            username: user.username,
            nickname: user.nickname
          })))
        }]
      };
    }
  );

  // 搜索用户
  server.resource(
    'search-users',
    new ResourceTemplate('users://search?q={query}', { list: undefined }),
    async (uri, params) => {
      const query = params.query as string;
      
      if (!query || query.trim() === '') {
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({ error: '搜索关键词不能为空' })
          }]
        };
      }

      const searchResults = mockUsers.filter(user => 
        user.username.includes(query) || 
        (user.nickname && user.nickname.includes(query))
      );

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({
            results: searchResults.map(user => ({
              id: user.id,
              username: user.username,
              nickname: user.nickname,
              status: user.status
            })),
            count: searchResults.length,
            query
          })
        }]
      };
    }
  );
}
