import { ref, Ref } from 'vue';
import { ImageryLayer, WebMapTileServiceImageryProvider } from 'cesium';
import useMapStore from '@/store/modules/mapStore';

export function useCesiumLayers() {
    const mapStore = useMapStore();
    const layers = ref<ImageryLayer[]>([]);

    const addLayer = (url: string, options: any = {}) => {
        const provider = new WebMapTileServiceImageryProvider({ url, ...options });
        const layer = mapStore.viewer!.imageryLayers.addImageryProvider(provider);
        layers.value.push(layer);
        return layer;
    };

    const removeLayer = (layer: ImageryLayer) => {
        mapStore.viewer!.imageryLayers.remove(layer);
        layers.value = layers.value.filter(l => l !== layer);
    };

    return { layers, addLayer, removeLayer };
}