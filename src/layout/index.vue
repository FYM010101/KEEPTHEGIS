<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useWindowSize } from '@vueuse/core'
import { useRouter } from 'vue-router';
//获取路由对象
// import { useRoute } from 'vue-router'
//引入左侧菜单logo子组件
import Logo from './logo/index.vue'
//引入菜单组件
// import Menu from './menu/index.vue'
import NavigationBar from '@/components/NavigationBar.vue'
import LeftInfo from './leftInfo/index.vue'
import FoldButton from '@/components/FoldButton.vue'
import CameraInfo from '@/libs/cesium/components/CameraInfo.vue'
// import Compass from '@/components/Compass.vue'
// 引入地图组件
import MapViewer from './mapViewer/index.vue';
//引入封装后的按钮组件
import CommonButton from '../components/CommonButton.vue'
//引入比例尺组件
import CesiumScale from '../libs/cesium/components/CesiumScale.vue'
import EChartsPanel from '@/components/EChartsPanel.vue';
import ViewPanel from '@/components/ViewPanel.vue';
import SideChartsContainer from '@/components/SideChartsContainer.vue';
import regionDataService, { regionState } from '@/services/regionDataService';
//获取配置仓库
import useMenuSettingStore from '../store/modules/menuSetting';
import useLayOutSettingStore from '../store/modules/layoutSetting';
import useMapStore from '../store/modules/mapStore'
let menuSettingStore = useMenuSettingStore();
let LayOutSettingStore = useLayOutSettingStore();
let mapStore = useMapStore();
const { locations } = mapStore;

//获取路由器对象
let $router = useRouter();

// 切换导航项
const switchNavItem = (path: string) => {
    //路由跳转
    $router.push(path);
    const location = locations[path];
    if (location) {
        mapStore.setView(location);
    }
    menuSettingStore.menuList.forEach((item, i) => {
        if (item.children) {
            item.children.forEach((navItem, j) => {
                if (navItem.path === path) {
                    navItem.meta.active = true;
                } else {
                    navItem.meta.active = false;
                }
            });
        }
    });
};

const handleSubmit = () => {
    console.log('按钮被点击了');
    mapStore.viewPanelVisible = true;
}
const closeViewPanel = () => {
    mapStore.viewPanelVisible = false;
}
// const zoomLevel = ref(1);
// const { width, height } = useWindowSize();
// const aspectRatio = computed(() => width.value / height.value);

// const handleZoom = (factor: number) => {
//     zoomLevel.value *= factor;
//     // 调用地图缩放逻辑
// };

//获取路由对象
// let $route = useRoute();
</script>

<template>
    <div class="layout_container">
        <!-- 顶部菜单 -->
        <div class="layout_toolbar">
            <div class="left_menu">
                <Logo></Logo>
                <!-- 展示菜单 -->
                <!--<el-menu :default-active="menuSettingStore.menuList[0].name" background-color="#00152999"
                    mode="horizontal" active-text-color="#80fdff" text-color="white">-->
                <!--根据路由动态生成菜单-->
                <!--<Menu :menuList="menuSettingStore.menuList"></Menu>
                </el-menu> -->
                <NavigationBar :menuList="menuSettingStore.menuList" @switch="switchNavItem" />
            </div>
            <!-- 右侧工具栏 -->
            <div class="right_btn">
                <!-- <div class="tool_btn"> -->
                <CommonButton type="text" size="large" @click="handleSubmit" class="camera-btn">
                    视角管理
                </CommonButton>
                <!-- <CommonButton type="text" :icon="'FullScreen'" @click="handleSubmit" />
                    <CommonButton type="text" :icon="'Upload'" @click="handleSubmit" /> -->
                <!-- </div> -->
            </div>
        </div>
        <!-- 地图展示区域 -->
        <div class="layout_viewer">
            <div class="map-container">
                <MapViewer></MapViewer>
            </div>
            <ViewPanel v-model:visible="mapStore.viewPanelVisible" @close="closeViewPanel()" />
            <EChartsPanel v-model:visible="regionState.showChart" :title="regionState.currentRegion?.name || '区域统计'"
                :regionName="regionState.currentRegion?.name || ''" :chartData="regionState.currentRegion || {}"
                @close="regionDataService.closeChart()" />
            <!-- 两侧图表容器 -->
            <SideChartsContainer />
            <!-- <div class="scale-controls large-screen-only">
                <button @click="handleZoom(0.8)">-</button>
                <span>{{ zoomLevel }}x</span>
                <button @click="handleZoom(1.2)">+</button>
            </div> -->
            <!-- 动态内容区域 -->
            <div class="content-container">
                <router-view />
            </div>
        </div>


        <!-- <div class="layout_leftInfo" :class="{ fold: LayOutSettingStore.fold ? true : false }">
            <LeftInfo />
        </div> -->
        <!-- <div class="layout_flodButton" :class="{ fold: LayOutSettingStore.fold ? true : false }">
            <FoldButton />
        </div> -->
        <div class="layout_bottomInfo" :class="{ fold: LayOutSettingStore.fold ? true : false }">
            <CameraInfo :mapInfo="mapStore.mapInfo"></CameraInfo>
            <CesiumScale />
        </div>
    </div>
</template>

<style scoped lang="scss">
.layout_container {
    width: 100%;
    height: 100vh;

    .layout_toolbar {
        display: flex;
        justify-content: space-between;
        // align-items: center; /* 垂直居中 */
        position: fixed;
        width: 100%;
        height: $base-menu-height;
        top: 0px;
        z-index: 1000;
        background: $base-menu-background;

        .left_menu {
            display: flex;

            .el-menu {
                width: 500px;
                height: 100%;
                border: none;
            }
        }

        .right_btn {
            display: flex;
            width: 200px;
            justify-content: center;
            align-items: center;

            .camera-btn {
                color: #ffffff;
                background: rgba(0, 90, 130, 0.7);
                border: 1px solid rgba(0, 191, 255, 0.4);
                border-radius: 4px;
                padding: 8px 12px;
                transition: all 0.3s;

                &:hover {
                    background: rgba(0, 120, 170, 0.8);
                    box-shadow: 0 0 8px rgba(0, 229, 255, 0.3);
                    transform: scale(1.05);
                }

                :deep(svg) {
                    // color: $base-menu-text-color;
                    font-size: 24px;
                }
            }
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
        // width: calc(100vw - $info-width - 20px);
        width: 100%;
        height: 20px;
        // left: $info-width;
        bottom: 0px;
        // background-color: $bottom-background;
        z-index: 1000;
        display: flex;
        justify-content: center;
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
