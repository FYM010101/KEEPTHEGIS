import { onMounted, onUnmounted, ref } from "vue";
//@ts-ignore
import useMapStore from '@/store/modules/mapStore';
import * as Cesium from "cesium";

const mapStore = useMapStore();
const viewer = ref<Cesium.Viewer | null>(null); // 让 Viewer 作为全局变量

export function useCesiumViewer(containerId: string) {
    onMounted(() => {
        if (!viewer.value && containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                viewer.value = new Cesium.Viewer(container, {
                    timeline: false, // 不显示时间线
                    animation: false, // 不显示动画控制
                    geocoder: false, // 不显示搜索按钮编码器
                    homeButton: false, // 显示初视角按钮
                    sceneModePicker: false, // 显示投影方式选择器
                    baseLayerPicker: false, // 显示基础图层选择器
                    navigationHelpButton: false, // 不显示帮助按钮
                    fullscreenButton: false, // 显示全屏按钮
                    infoBox: false, // 信息框
                    selectionIndicator: false   // 绿色的定位框
                    // terrain: Cesium.Terrain.fromWorldTerrain(),
                });
                if (!mapStore.viewer) {
                    mapStore.initializeViewer(viewer);
                    mapStore.setView(mapStore.locations['/home']);
                }
            }
        }
    });

    onUnmounted(() => {
        if (viewer.value) {
            viewer.value.destroy();
            viewer.value = null;
        }
    });

    return { viewer };
}
