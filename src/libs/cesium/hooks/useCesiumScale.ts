import { onMounted, onUnmounted, ref, Ref } from 'vue';
import * as Cesium from "cesium";
import useMapStore from '@/store/modules/mapStore';

export function useCesiumScale() {
    const mapStore = useMapStore();
    const scaleText = ref('');
    
    // 获取 viewer 实例的安全方法
    const getViewer = (): Cesium.Viewer | null => {
        return mapStore.viewer ?? null;
    };

    // 获取当前地图比例（添加空值检查）
    const getMapScale = (): number => {
        const viewer = getViewer();
        if (!viewer) {
            console.error('Viewer 未初始化');
            return 0;
        }

        const { scene, camera, canvas } = viewer;
        try {
            const center = new Cesium.Cartesian2(
                Math.floor(canvas.clientWidth / 2),
                Math.floor(canvas.clientHeight / 2)
            );
            const ray = camera.getPickRay(center);
            const groundPosition = ray ? scene.globe.pick(ray, scene) : undefined;
            
            let metersPerPixel = 0;
            if (Cesium.defined(groundPosition)) {
                const distance = Cesium.Cartesian3.distance(camera.position, groundPosition);
                const aspectRatio = canvas.clientWidth / canvas.clientHeight;
                //@ts-ignore
                const hFOV = 2 * Math.atan(Math.tan(camera.frustum.fov / 2) * aspectRatio);
                const groundWidth = 2 * distance * Math.tan(hFOV / 2);
                metersPerPixel = groundWidth / canvas.clientWidth;
            }
            return metersPerPixel;
        } catch (error) {
            console.error('计算比例尺出错:', error);
            return 0;
        }
    };

    // 更新比例尺（添加防抖机制）
    const updateScale = () => {
        const metersPerPixel = getMapScale();
        if (metersPerPixel > 0) {
            const scaleLength = metersPerPixel * 100;
            scaleText.value = formatScaleText(scaleLength);
        }
    };

    // 监听相机变化（添加空值检查）
    onMounted(() => {
        const viewer = getViewer();
        if (viewer) {
            viewer.camera.changed.addEventListener(updateScale);
            updateScale();
        }
    });

    // 销毁监听器（添加空值检查）
    onUnmounted(() => {
        const viewer = getViewer();
        if (viewer) {
            viewer.camera.changed.removeEventListener(updateScale);
        }
    });

    // 格式化比例尺文本
    const formatScaleText = (distance: number): string => {
        if (distance >= 1000) {
            return `${(distance / 1000).toFixed(1)} km`;
        } else {
            return `${Math.round(distance)} m`;
        }
    };

    return { scaleText };
}