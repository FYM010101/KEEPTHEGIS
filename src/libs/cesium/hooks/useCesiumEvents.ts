import { ref, onUnmounted } from 'vue';
import { ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium';
//@ts-ignore
// import useMapStore from '@/store/modules/mapStore';
// const mapStore = useMapStore();
export function useCesiumEvents(viewer: Ref<Cesium.Viewer>) {
    const handler = ref<ScreenSpaceEventHandler | null>(null);

    const addEvent = (type: ScreenSpaceEventType, callback: (event: any) => void) => {
        if (!handler.value) {
            handler.value = new ScreenSpaceEventHandler(viewer.value.scene.canvas);
        }
        handler.value.setInputAction(callback, type);
    };

    const removeEvent = (type: ScreenSpaceEventType) => {
        if (handler.value) {
            handler.value.removeInputAction(type);
        }
    };

    onUnmounted(() => {
        if (handler.value) {
            handler.value.destroy();
        }
    });

    return { addEvent, removeEvent };
}