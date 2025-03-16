<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as Cesium from 'cesium';
import useMapStore from '@/store/modules/mapStore';
import { useCesiumEvents } from '@/libs/cesium/hooks/useCesiumEvents';
import regionDataService, { regionState } from '@/services/regionDataService';
const mapStore = useMapStore();

const highlightedFeature = { feature: null as Cesium.Entity | null };

let defaultFillColor = new Cesium.Color(0, 0.4, 0.5, 0.3);
let selectedColor = new Cesium.Color(0.3, 0.8, 0.85, 0.5);
onMounted(() => {
    const cesiumEvents = useCesiumEvents(mapStore.viewer);
    mapStore.loadGeoJson();
    cesiumEvents.addEvent('LEFT_CLICK', (entity: any) => {
        if (entity) {
            //如果当前高亮的不是同一个省份
            if (highlightedFeature.feature !== entity) {
                // 恢复之前的高亮省份样式
                if (highlightedFeature.feature) {
                    resetHighlight(highlightedFeature.feature);
                }

                // 高亮当前省份
                highlightedFeature.feature = entity;
                highlightFeature(entity);
            }
            mapStore.handleRegionClick(entity);
        } else {
            // 如果没有拾取到任何实体，恢复高亮省份的样式
            if (highlightedFeature.feature) {
                resetHighlight(highlightedFeature.feature);
                highlightedFeature.feature = null;
            }
        }
    });
})
// 高亮省份
const highlightFeature = (entity: Cesium.Entity) => {
    if (entity.polygon) {
        entity.polygon.material = new Cesium.ColorMaterialProperty(selectedColor); // 设置高亮颜色
    }
};

// 恢复省份的默认样式
const resetHighlight = (entity: Cesium.Entity) => {
    if (entity.polygon) {
        entity.polygon.material = new Cesium.ColorMaterialProperty(defaultFillColor); // 恢复默认颜色
    }
};

onUnmounted(() => {
    mapStore.removeGeoJson('/data/geojson/china.geojson');
    regionState.showChart = false;
    mapStore.viewPanelVisible = false;
})
</script>
<template>

</template>

<style scoped></style>
