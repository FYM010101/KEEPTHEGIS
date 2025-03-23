import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
// import { viteStaticCopy } from 'vite-plugin-static-copy';

import cesium from 'vite-plugin-cesium'; // 使用官方推荐插件
// 引入define插件用于定义全局变量
import { Plugin } from 'vite';
// import fs from 'fs';
// import { nodeResolve } from '@rollup/plugin-node-resolve';

// 定义CESIUM_BASE_URL全局变量的插件
// function cesiumBaseUrlPlugin(): Plugin {
//   return {
//     name: 'cesium-base-url',
//     config() {
//       return {
//         define: {
//           CESIUM_BASE_URL: JSON.stringify('cesium')
//         }
//       };
//     }
//   };
// }

export default defineConfig({
  plugins: [
    vue(),
    cesium(),
    // cesiumBaseUrlPlugin(),
    // nodeResolve(),
    // viteStaticCopy({
    //   targets: [
    //     {
    //       src: path.resolve(__dirname, 'node_modules/cesium/Build/Cesium/Workers'),
    //       dest: 'cesium'
    //     },
    //     {
    //       src: path.resolve(__dirname, 'node_modules/cesium/Build/Cesium/Assets'),
    //       dest: 'cesium'
    //     },
    //     {
    //       src: path.resolve(__dirname, 'node_modules/cesium/Build/Cesium/Widgets'),
    //       dest: 'cesium'
    //     },
    //     {
    //       src: path.resolve(__dirname, 'node_modules/cesium/Build/Cesium/ThirdParty'),
    //       dest: 'cesium'
    //     }
    //   ]
    // })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 处理 Cesium 模块别名
      // 'cesium': path.resolve(__dirname, 'node_modules/cesium')
    },
  },
  // optimizeDeps: {
  //   // 强制预构建 Cesium
  //   include: ['cesium'],
  //   esbuildOptions: {
  //     // 解决大型二进制文件的处理问题
  //     plugins: [
  //       {
  //         name: 'cesium-binary',
  //         setup(build) {
  //           build.onLoad({ filter: /\.glb$|\.wasm$|\.zip$/ }, () => ({ contents: '' }));
  //         }
  //       }
  //     ]
  //   }
  // },
  build: {
    // 配置 Rollup 构建选项
    rollupOptions: {
      // external: ['cesium'] // 防止将 Cesium 打包到主 bundle
    }
  },
  server: {
    port: 8080, // 设置开发服务器端口
    open: true, // 自动打开浏览器
    // 允许加载 Cesium 的 Worker 文件
    // fs: {
    //   // strict: false
    // },
    // headers: {
    //   'Cross-Origin-Opener-Policy': 'same-origin',
    //   'Cross-Origin-Embedder-Policy': 'require-corp'
    // }
  },
  //scss全局变量配置
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/variable.scss";',
      },
    },
  },
});

