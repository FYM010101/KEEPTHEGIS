import { onMounted, onUnmounted, ref } from 'vue';
import * as Cesium from "cesium";
//@ts-ignore
import useMapStore from '@/store/modules/mapStore';
const mapStore = useMapStore();

export function useCesiumScale() {
    const scaleText = ref('');
    
    // 获取当前地图比例
    const getMapScale = (): number => {
        const scene = mapStore.viewer.scene;
        const camera = mapStore.viewer.camera;
        const canvas = mapStore.viewer.canvas;
        const center = new Cesium.Cartesian2(
            Math.floor(canvas.clientWidth / 2),
            Math.floor(canvas.clientHeight / 2)
        );
        const ray = camera.getPickRay(center);
        const groundPosition = scene.globe.pick(ray, scene);
        let metersPerPixel: number = 0;
        if (Cesium.defined(groundPosition)) {
            const distance = Cesium.Cartesian3.distance(camera.position, groundPosition);
            const aspectRatio = canvas.clientWidth / canvas.clientHeight;
            const hFOV = 2 * Math.atan(Math.tan(camera.frustum.fov / 2) * aspectRatio);
            const groundWidth = 2 * distance * Math.tan(hFOV / 2);
            metersPerPixel = groundWidth / canvas.clientWidth;
        }
        return metersPerPixel;
    };

    // 格式化比例尺文本
    const formatScaleText = (distance: number): string => {
        if (distance >= 1000) {
            return `${(distance / 1000).toFixed(1)} km`;
        } else {
            return `${Math.round(distance)} m`;
        }
    };

    // 更新比例尺
    const updateScale = () => {
        const metersPerPixel = getMapScale();
        const scaleLength = metersPerPixel * 100; // 假设比例尺宽度为 100 像素
        scaleText.value = formatScaleText(scaleLength);
    };

    // 监听相机变化
    onMounted(() => {
        mapStore.viewer.camera.changed.addEventListener(updateScale);
        updateScale(); // 初始化比例尺
    });

    // 销毁监听器
    onUnmounted(() => {
        mapStore.viewer.camera.changed.removeEventListener(updateScale);
    });

    return { scaleText };
}