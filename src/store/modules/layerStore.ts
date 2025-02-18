import { defineStore } from "pinia";
import type { Layer, LayerState } from "./types/type";

// 使用 Pinia 定义 Store
export const useLayerStore = defineStore("layerStore", {
    state: (): LayerState => ({
        layers: [],
    }),
    actions: {
        // 添加图层
        addLayer(layer: Layer) {
            this.layers.push(layer);
        },

        // 移除图层
        removeLayer(id: string) {
            this.layers = this.layers.filter((layer) => layer.id !== id);
        },

        // 切换图层可见性
        toggleLayer(id: string) {
            const layer = this.layers.find((layer) => layer.id === id);
            if (layer) layer.visible = !layer.visible;
        },

        // 更新图层样式
        updateStyle(id: string, newStyle: Record<string, any>) {
            const layer = this.layers.find((layer) => layer.id === id);
            if (layer) layer.style = newStyle;
        },
    },
});
