import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Group } from '../types.js';

// 模拟数据 - 在实际应用中，这些数据应该从数据库中获取
const mockGroups: Group[] = [
  {
    id: 'group-1',
    name: '技术讨论组',
    description: '讨论技术相关话题的群组',
    avatar: 'https://example.com/avatars/group1.png',
    createdBy: 'user-1',
    createdAt: new Date('2023-01-01'),
    members: ['user-1', 'user-2', 'user-3']
  },
  {
    id: 'group-2',
    name: '产品设计组',
    description: '讨论产品设计相关话题的群组',
    avatar: 'https://example.com/avatars/group2.png',
    createdBy: 'user-2',
    createdAt: new Date('2023-02-15'),
    members: ['user-2', 'user-4', 'user-5']
  }
];

/**
 * 注册群组相关的MCP资源
 * @param server MCP服务器实例
 */
export function registerGroupResources(server: McpServer) {
  // 获取所有群组
  server.resource(
    'groups-list',
    'groups://list',
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: JSON.stringify(mockGroups.map(group => ({
          id: group.id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length
        })))
      }]
    })
  );

  // 获取特定群组详情
  server.resource(
    'group-detail',
    new ResourceTemplate('groups://{groupId}', { list: undefined }),
    async (uri, params) => {
      const groupId = params.groupId as string;
      const group = mockGroups.find(g => g.id === groupId);
      
      if (!group) {
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({ error: '群组不存在' })
          }]
        };
      }

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(group)
        }]
      };
    }
  );

  // 获取群组成员
  server.resource(
    'group-members',
    new ResourceTemplate('groups://{groupId}/members', { list: undefined }),
    async (uri, params) => {
      const groupId = params.groupId as string;
      const group = mockGroups.find(g => g.id === groupId);
      
      if (!group) {
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({ error: '群组不存在' })
          }]
        };
      }

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ members: group.members })
        }]
      };
    }
  );

  // 获取用户所在的群组
  server.resource(
    'user-groups',
    new ResourceTemplate('users://{userId}/groups', { list: undefined }),
    async (uri, params) => {
      const userId = params.userId as string;
      const userGroups = mockGroups.filter(group => group.members.includes(userId));
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(userGroups.map(group => ({
            id: group.id,
            name: group.name,
            description: group.description,
            memberCount: group.members.length
          })))
        }]
      };
    }
  );
}
