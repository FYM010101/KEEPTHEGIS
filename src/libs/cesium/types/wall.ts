import type { Color } from 'cesium';

// 材质选项类型
export interface WallMaterialOptions {
    color?: Color;
    rate?: number;
    repeatNum?: number;
}

// 墙体参数类型
export interface WallParams {
    positions: number[]; // [经度, 纬度, 高度, ...]
    materialOptions?: WallMaterialOptions;
}