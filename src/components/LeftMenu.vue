<template>
    <template v-for="(item) in menuList" :key="item.name">
        <!--没有子路由-->
        <template v-if="!item.children">
            <el-menu-item :index="item.name" v-if="!item.meta.hidden">
                <el-icon>
                    <component :is="item.meta.icon"></component>
                </el-icon>
                <template #title>
                    <span>{{ item.meta.title }}</span>
                </template>
            </el-menu-item>
        </template>
        <!-- 有子路由但是只有一个子路由 -->
        <template v-if="item.children && item.children.length == 1">
            <el-menu-item :index="item.children[0].name" v-if="!item.children[0].meta.hidden">
                <el-icon>
                    <component :is="item.children[0].meta.icon"></component>
                </el-icon>
                <template #title>
                    <span>{{ item.children[0].meta.title }}</span>
                </template>
            </el-menu-item>
        </template>
        <!-- 有子路由且个数大于一个1 -->
        <el-sub-menu :index="item.name" v-if="item.children && item.children.length > 1">
            <template #title>
                <el-icon>
                    <component :is="item.meta.icon"></component>
                </el-icon>
                <span>{{ item.meta.title }}</span>
            </template>
            <LeftMenu :menuList="item.children"></LeftMenu>
        </el-sub-menu>
    </template>
</template>

<script setup lang="ts">
// import { useRouter } from 'vue-router';
//获取父组件传递过来的全部路由数组
defineProps(['menuList']);

//获取路由器对象
// let $router = useRouter();
//点击菜单的回调
// const goRoute = (vc: any) => {
//     //路由跳转
//     $router.push(vc.index);
// }
</script>
<script lang="ts">
export default {
    name: 'LeftMenu'
}
</script>

<style scoped></style>