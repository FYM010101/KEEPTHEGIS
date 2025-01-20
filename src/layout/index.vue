<script setup lang="ts">
//获取路由对象
// import { useRoute } from 'vue-router'
//引入左侧菜单logo子组件
import Logo from './logo/index.vue'
//引入菜单组件
import Menu from './menu/index.vue'
import LeftInfo from './leftInfo/index.vue'
import FoldButton from '@/components/FoldButton.vue'
import BottomInfo from '@/components/BottomInfo.vue'
// import Compass from '@/components/Compass.vue'
//右侧内容展示区域
import MapViewer from './mapViewer/index.vue';
import useMenuSettingStore from '../store/modules/menuSetting';
import useLayOutSettingStore from '../store/modules/layoutSetting';
import useMapStore from '../store/modules/mapStore'
let menuSettingStore = useMenuSettingStore();
//获取layout配置仓库
let LayOutSettingStore = useLayOutSettingStore();
let mapStore = useMapStore();

//获取路由对象
// let $route = useRoute();
</script>

<template>
    <div class="layout_container">
        <!-- 顶部菜单 -->
        <div class="layout_slider">
            <Logo></Logo>
            <!-- 展示菜单 -->
            <el-menu :default-active="menuSettingStore.menuList[0].name" background-color="#00152999" mode="horizontal"
                active-text-color="#80fdff" text-color="white">
                <!--根据路由动态生成菜单-->
                <Menu :menuList="menuSettingStore.menuList"></Menu>
            </el-menu>
        </div>
        <!-- 地图展示区域 -->
        <div class="layout_viewer">
            <div class="map-container">
                <MapViewer></MapViewer>
            </div>
            <!-- 动态内容区域 -->
            <div class="content-container">
                <router-view />
            </div>
        </div>

        <div class="layout_leftInfo" :class="{ fold: LayOutSettingStore.fold ? true : false }">
            <LeftInfo />
        </div>
        <div class="layout_flodButton" :class="{ fold: LayOutSettingStore.fold ? true : false }">
            <FoldButton />
        </div>
        <!-- <div class="layout_rightInfo">

        </div> -->
        <div class="layout_bottomInfo" :class="{ fold: LayOutSettingStore.fold ? true : false }">
            <BottomInfo :mapInfo="mapStore.mapInfo"></BottomInfo>
        </div>
        <!-- <div class="layout_compass">
            <Compass />
        </div> -->

    </div>
</template>

<style scoped lang="scss">
.layout_container {
    width: 100%;
    height: 100vh;

    .layout_slider {
        display: flex;
        position: fixed;
        width: 100%;
        height: $base-menu-height;
        top: 0px;
        z-index: 1000;

        .el-menu {
            width: 100%;
            height: 100%;
            border: none;
        }
    }

    .layout_viewer {
        position: relative;
        width: 100%;
        height: 100vh;

        .map-container {
            width: 100%;
            height: 100vh;
        }

        .content-container {
            position: fixed;
            width: 300px;
            height: 500px;
            top: 100px;
            left: 100px;
            z-index: 1000;
            display: none;
        }
    }

    .layout_leftInfo {
        position: fixed;
        width: $info-width;
        height: calc(100vh - $base-menu-height);
        top: $base-menu-height;
        background-color: $info-background;
        z-index: 1000;
        transition: all 0.3s;

        &.fold {
            width: 0px;
        }
    }

    .layout_flodButton {
        position: fixed;
        top: $base-menu-height;
        left: $info-width;
        z-index: 1000;
        transition: all 0.3s;

        &.fold {
            left: 15px;
        }
    }

    .layout_rightInfo {
        position: fixed;
        width: $info-width;
        height: calc(100vh - $base-menu-height);
        top: $base-menu-height;
        right: 0px;
        background-color: $info-background;
        z-index: 1000;
    }

    .layout_bottomInfo {
        position: fixed;
        width: calc(100vw - $info-width);
        height: 20px;
        left: $info-width;
        bottom: 0px;
        // background-color: $bottom-background;
        z-index: 1000;
        transition: all 0.3s;

        &.fold {
            left: 0px;
            width: 100vw;
        }
    }

    // .layout_compass {
    //     position: fixed;
    //     top: 100px;
    //     right: 50px;
    //     z-index: 1000;
    // }
}
</style>
