<script setup lang="ts">
import { useRouter } from 'vue-router';
//@ts-ignore
import useMapStore from '@/store/modules/mapStore';
import { throttle } from 'lodash';
const mapStore = useMapStore();
const { locations } = mapStore;
//获取父组件传递过来的菜单数组
defineProps(['menuList']);

//获取路由器对象
let $router = useRouter();
//点击菜单的回调
const navigateToPage = throttle((menuItem: any) => {
    //路由跳转
    $router.push(menuItem.index);
    const location = locations[menuItem.index];
    if (location) {
        // console.log(location)
        mapStore.setView(location);
    }
},500)
</script>
<script lang="ts">
export default {
    name: 'Menu'
}
</script>
<template>
    <template v-for="(item) in menuList" :key="item.path">
        <template v-if="item.children">
            <template v-for="(item2) in item.children" :key="item2.path">
                <el-menu-item :index="item2.path" v-if="!item2.meta.hidden" @click="navigateToPage">
                    <template #title>
                        <span>{{ item2.meta.title }}</span>
                    </template>
                </el-menu-item>
            </template>
        </template>
    </template>
</template>

<style scoped></style>
