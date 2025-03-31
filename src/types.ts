// MCP服务的通用类型定义

// 用户信息类型
export interface User {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  lastActive?: Date;
}

// 群组信息类型
export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  createdAt: Date;
  members: string[]; // 用户ID列表
}

// 消息类型
export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string; // 可以是用户ID或群组ID
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  timestamp: Date;
  isRead: boolean;
  isGroup: boolean; // 是否是群组消息
}

// 聊天会话类型
export interface Conversation {
  id: string;
  participants: string[]; // 用户ID列表
  lastMessage?: Message;
  unreadCount: number;
  isGroup: boolean;
  groupId?: string; // 如果是群组会话，则有群组ID
}

// 搜索结果类型
export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export {};
