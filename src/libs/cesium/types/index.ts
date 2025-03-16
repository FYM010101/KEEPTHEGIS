import type { Entity, ImageryLayer, ScreenSpaceEventHandler } from 'cesium';
import type { WallParams, StreamerLineParams } from './effectParams';
import type { WallMaterialOptions, StreamerLineMaterialOptions } from './material';
import type { CircleScanOptions, CircleScanSystem } from './cesiumEffect';

export interface CesiumViewerOptions {
    terrainProvider?: any;
    imageryProvider?: any;
    // 其他配置项
}

export type CesiumEntity = Entity;
export type CesiumLayer = ImageryLayer;
export type CesiumEventHandler = ScreenSpaceEventHandler;

export { StreamerLineParams, StreamerLineMaterialOptions, WallMaterialOptions, WallParams, CircleScanOptions, CircleScanSystem };
