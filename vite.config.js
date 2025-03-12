import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import cesium from 'vite-plugin-cesium';
import path from 'path';
export default defineConfig({
    plugins: [vue(), cesium()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        },
    },
    server: {
        port: 8080, // 设置开发服务器端口
        open: true, // 自动打开浏览器
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
