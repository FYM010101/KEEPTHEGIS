import { ref } from 'vue';
import { Entity, Cartesian3 } from 'cesium';
//@ts-ignore
import useMapStore from '@/store/modules/mapStore';
const mapStore = useMapStore();
export function useCesiumEntities() {
    const entities = ref<Entity[]>([]);

    const addEntity = (position: Cartesian3, options: any = {}) => {
        const entity = mapStore.viewer.entities.add({
            position,
            ...options,
        });
        entities.value.push(entity);
        return entity;
    };

    const removeEntity = (entity: Entity) => {
        mapStore.viewer.entities.remove(entity);
        entities.value = entities.value.filter(e => e !== entity);
    };

    return { entities, addEntity, removeEntity };
}