import type { Entity, ImageryLayer, ScreenSpaceEventHandler } from 'cesium';
import type { WallMaterialOptions, WallParams } from './wall'

export interface CesiumViewerOptions {
    terrainProvider?: any;
    imageryProvider?: any;
    // 其他配置项
}

export type CesiumEntity = Entity;
export type CesiumLayer = ImageryLayer;
export type CesiumEventHandler = ScreenSpaceEventHandler;

export { WallMaterialOptions, WallParams };