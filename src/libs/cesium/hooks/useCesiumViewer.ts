import { onMounted, onUnmounted, ref, Ref } from "vue";
import useMapStore from '@/store/modules/mapStore';
import * as Cesium from "cesium";

// 默认的 viewer 配置选项
const DEFAULT_VIEWER_OPTIONS: Cesium.Viewer.ConstructorOptions = {
    timeline: false,            // 不显示时间线
    animation: false,           // 不显示动画控制
    geocoder: false,            // 不显示搜索按钮编码器
    homeButton: false,          // 显示初视角按钮
    sceneModePicker: false,     // 显示投影方式选择器
    baseLayerPicker: false,     // 显示基础图层选择器
    navigationHelpButton: false, // 不显示帮助按钮
    fullscreenButton: false,    // 显示全屏按钮
    infoBox: false,             // 信息框
    selectionIndicator: false   // 绿色的定位框
    // terrain: Cesium.Terrain.fromWorldTerrain(),
};

export function useCesiumViewer(containerId: string): {
    viewer: Ref<Cesium.Viewer | null>,
    initialize: () => Promise<Cesium.Viewer | null>
} {
    const viewer = ref<Cesium.Viewer | null>(null);
    const mapStore = useMapStore();

    // 初始化函数，返回 Promise 以便于异步处理
    const initialize = async (): Promise<Cesium.Viewer | null> => {
        if (viewer.value) return viewer.value;

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`容器元素 #${containerId} 未找到`);
            return null;
        }

        try {
            // 创建 Cesium Viewer 实例
            viewer.value = new Cesium.Viewer(container, DEFAULT_VIEWER_OPTIONS);

            // 开启帧率显示
            viewer.value.scene.debugShowFramesPerSecond = true;

            // 初始化地图存储
            if (!mapStore.viewer) {
                mapStore.initializeViewer(viewer);

                // 设置初始视图
                const homeLocation = mapStore.locations['/home'];
                if (homeLocation) {
                    mapStore.setView(homeLocation);
                }
            }

            return viewer.value;
        } catch (error) {
            console.error('初始化 Cesium Viewer 失败:', error);
            return null;
        }
    };

    onMounted(() => {
        if (containerId) {
            initialize();
        }
    });

    onUnmounted(() => {
        if (viewer.value) {
            try {
                viewer.value.destroy();
            } catch (error) {
                console.error('销毁 Cesium Viewer 失败:', error);
            } finally {
                viewer.value = null;
            }
        }
    });

    return { viewer, initialize };
}