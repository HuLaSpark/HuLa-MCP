import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist');

async function copyJsFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(dir, entry.name);
    const relativePath = path.relative(srcDir, srcPath);
    const destPath = path.join(distDir, relativePath);
    
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true }).catch(() => {});
      await copyJsFiles(srcPath);
    } else if (entry.name.endsWith('.js')) {
      await fs.copyFile(srcPath, destPath).catch(err => {
        if (err.code !== 'ENOENT') throw err;
        console.error(`无法复制文件: ${srcPath}`);
      });
    }
  }
}

// 删除所有 .map 文件的函数
async function removeMapFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await removeMapFiles(fullPath);
    } else if (entry.name.endsWith('.map')) {
      await fs.unlink(fullPath);
      console.log(`已删除: ${fullPath}`);
    }
  }
}

// 执行复制和清理操作
async function main() {
  await copyJsFiles(srcDir);
  await removeMapFiles(distDir);
}

main().catch(console.error); 