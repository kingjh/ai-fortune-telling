import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // 设置基础路径为 /项目名/
  base: '/ai-fortune-telling/',
  plugins: [vue()],
  build: {
    // 输出目录设置为 ../docs
    outDir: path.resolve(__dirname, 'docs'),
    // 静态资源直接输出到 docs 文件夹下
    assetsDir: ''
  }
});
