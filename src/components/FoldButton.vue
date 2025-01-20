<script setup lang="ts">
//@ts-ignore
import useLayOutSettingStore from '@/store/modules/layoutSetting';

//获取layout配置相关的仓库
let LayOutSettingStore = useLayOutSettingStore();

//点击图标的方法
const changeIcon = () => {
    //图标进行切换
    LayOutSettingStore.fold = !LayOutSettingStore.fold
}
</script>
<template>
    <el-icon :size="30" style="margin-right:10px; color:#5cd6d6;" @click="changeIcon">
        <component :is="LayOutSettingStore.fold ? 'Fold' : 'Expand'"></component>
    </el-icon>
</template>

<style scoped></style>