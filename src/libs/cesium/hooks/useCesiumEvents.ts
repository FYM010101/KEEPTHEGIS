import { ref, onUnmounted } from 'vue';
import { ScreenSpaceEventHandler, ScreenSpaceEventType, defined, Entity } from 'cesium';
// 添加事件总线引用
import { eventBus, CesiumEvents } from '@/services/eventBus';
//@ts-ignore
// import useMapStore from '@/store/modules/mapStore';
// const mapStore = useMapStore();
export function useCesiumEvents(viewer: Ref<Cesium.Viewer>) {
    const handler = ref<ScreenSpaceEventHandler | null>(null);

    // 添加类型安全的事件类型映射
    type EventCallbackMap = {
        'LEFT_CLICK': (position: Cesium.Entity | null) => void;
        'RIGHT_CLICK': (position: Cesium.Entity | null) => void;
        'MOUSE_MOVE': (position: Cesium.Entity | null) => void;
    };

    // 更新addEvent方法签名
    const addEvent = <T extends keyof EventCallbackMap>(
        type: T,
        callback: EventCallbackMap[T]
    ) => {
        if (!handler.value) {
            handler.value = new ScreenSpaceEventHandler(viewer.scene.canvas);
        }

        handler.value.setInputAction((movement: any) => {
            // const cartesian = viewer.value.scene.pickPosition(movement.position);
            // if (defined(cartesian)) {
            //   (callback as any)(cartesian);
            //   // 分发对应类型事件
            //   eventBus.emit(`cesium:${type.toLowerCase().replace('_', '-')}` as keyof CesiumEvents, cartesian);
            // }
            const pickedObject = viewer.scene.pick(movement.position);

            // 如果拾取到的是 GeoJSON 中的实体
            if (defined(pickedObject) && pickedObject.id instanceof Entity) {
                const entity = pickedObject.id;

                (callback as any)(entity);
                // 分发对应类型事件
                eventBus.emit(`cesium:${type.toLowerCase().replace('_', '-')}` as keyof CesiumEvents, entity);
            } else {
                // 如果没有拾取到任何实体，恢复高亮省份的样式
                (callback as any)(null);
                // 分发对应类型事件
                eventBus.emit(`cesium:${type.toLowerCase().replace('_', '-')}` as keyof CesiumEvents, null);
            }
        }, ScreenSpaceEventType[type]);
    };

    // 更新removeEvent参数类型
    const removeEvent = <T extends keyof EventCallbackMap>(type: T) => {
        if (handler.value) {
            handler.value.removeInputAction(ScreenSpaceEventType[type]);
        }
    };

    onUnmounted(() => {
        if (handler.value) {
            handler.value.destroy();
        }
    });

    return { addEvent, removeEvent };
}