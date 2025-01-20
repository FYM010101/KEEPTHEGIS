<template>
    <div class="leftInfo">
        <el-scrollbar class="scrollbar">
            <!-- 菜单组件-->
            <el-menu :collapse="LayOutSettingStore.fold ? true : false" background-color="#00152999" text-color="white"
                active-text-color="yellowgreen">
                <!--根据路由动态生成菜单-->
                <LeftMenu :menuList="leftMenuStore.leftMenuList"></LeftMenu>
            </el-menu>
        </el-scrollbar>
    </div>
</template>

<script setup lang="ts">
//@ts-ignore
import useLayOutSettingStore from '@/store/modules/layoutSetting';
//@ts-ignore
import useLeftMenuStore from '@/store/modules/leftMenuStore';
import LeftMenu from '@/components/LeftMenu.vue';

//获取layout配置相关的仓库
let LayOutSettingStore = useLayOutSettingStore();
let leftMenuStore = useLeftMenuStore();

</script>
<script lang="ts">
export default {
    name: "LeftInfo"
}
</script>
<style scoped lang="scss">
.leftInfo {
    height: 100vh;
    // padding: 20px;

    .scrollbar {
        width: 100%;
        height: calc(100vh - $base-menu-height);

        .el-menu {
            border-right: none;
        }
    }
}
</style>