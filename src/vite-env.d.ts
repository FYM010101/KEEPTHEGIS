/// <reference types="vite/client" />
//解决ts文件引入vue文件出现红色警告问题
// declare module '*.vue' {
//     import { defineComponent } from 'vue'
//     const Component: ReturnType<typeof defineComponent>
//     export default Component
// }

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}