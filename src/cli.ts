#!/usr/bin/env node
import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// 在ESM模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取包信息
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

program
  .name('hula-mcp')
  .description('HuLa MCP服务命令行工具')
  .version(packageJson.version);

program
  .command('start')
  .description('启动MCP服务')
  .option('-p, --port <port>', '指定端口号', '3100')
  .action((options) => {
    console.log(`🚀 正在启动HuLa MCP服务，端口: ${options.port}...`);
    
    // 设置环境变量
    process.env.PORT = options.port;
    
    // 启动服务
    const serverPath = path.join(__dirname, 'index.js');
    spawn('node', [serverPath], { stdio: 'inherit' });
  });

program
  .command('setup')
  .description('设置MCP服务集成')
  .argument('<url>', 'MCP服务的URL，例如: http://localhost:3100')
  .option('-c, --client <client>', '客户端类型 (cursor|windsurf)', 'cursor')
  .action(async (url, options) => {
    const client = options.client.toLowerCase();
    
    if (client !== 'cursor' && client !== 'windsurf') {
      console.error('错误: 客户端类型必须是 cursor 或 windsurf');
      process.exit(1);
    }
    
    console.log(`🔗 正在设置HuLa MCP服务集成到 ${client}...`);
    console.log(`服务URL: ${url}`);
    
    try {
      // 检查URL是否有效
      const response = await fetch(`${url}/health`);
      if (!response.ok) {
        throw new Error(`服务健康检查失败: ${response.status}`);
      }
      
      // 创建配置文件
      const configDir = getConfigDir(client);
      const configPath = path.join(configDir, 'mcp-config.json');
      
      // 确保配置目录存在
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // 写入配置文件
      const config = {
        name: 'HuLa-MCP',
        version: packageJson.version,
        description: 'HuLa即时通讯应用的MCP服务',
        baseUrl: url,
        endpoints: {
          sse: '/sse',
          messages: '/messages'
        }
      };
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      console.log(`✅ 配置文件已创建: ${configPath}`);
      console.log(`HuLa MCP服务已成功集成到 ${client}!`);
    } catch (error: any) {
      console.error(`❌ 设置失败: ${error.message}`);
      process.exit(1);
    }
  });

// 获取配置目录
function getConfigDir(client: string): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  
  if (!homeDir) {
    throw new Error('无法确定用户主目录');
  }
  
  if (client === 'cursor') {
    return path.join(homeDir, '.cursor', 'mcp');
  } else if (client === 'windsurf') {
    return path.join(homeDir, '.windsurf', 'mcp');
  }
  
  throw new Error(`不支持的客户端类型: ${client}`);
}

program.parse();
