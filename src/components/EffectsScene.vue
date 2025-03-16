<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import useMapStore from '@/store/modules/mapStore';
const mapStore = useMapStore();
onMounted(() => {
    mapStore.loadEffectsData();
})
onUnmounted(() => {
    mapStore.removeTileset('/data/tileset.json');
    mapStore.removeWallEffect('mainWall');
    mapStore.removeAllStreamerLineEffect();
    mapStore.removeXFC()
    mapStore.removePopup();
})
</script>
<template>

</template>

<style scoped></style>
