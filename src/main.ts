import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import '@/styles/index.scss'
// import './assets/styles/responsive.css'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
//@ts-expect-error
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

//引入仓库
import pinia from './store'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 设置 Cesium 静态资源路径
// 为window对象声明CESIUM_BASE_URL属性
// declare global {
//     interface Window {
//         CESIUM_BASE_URL: string;
//     }
// }
// window.CESIUM_BASE_URL = '/cesium/';

// // 在设置CESIUM_BASE_URL后导入Cesium的CSS
// import 'cesium/Build/Cesium/Widgets/widgets.css';

const app = createApp(App);

app.use(router);
app.use(ElementPlus, {
    locale: zhCn, //element-plus国际化配置
});
//安装仓库
app.use(pinia)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.mount('#app');
