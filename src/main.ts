import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import '@/styles/index.scss'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
//@ts-expect-error
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

//引入仓库
import pinia from './store'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

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
