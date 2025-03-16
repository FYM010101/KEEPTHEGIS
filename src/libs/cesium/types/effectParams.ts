import { WallMaterialOptions, StreamerLineMaterialOptions } from './material';

// 墙体参数类型
export interface WallParams {
    positions: number[]; // [经度, 纬度, 高度, ...]
    materialOptions?: WallMaterialOptions;
}
// 流光线参数类型
export interface StreamerLineParams {
    positions: number[]; // [经度, 纬度, 高度, ...]
    width: number;
    materialOptions?: StreamerLineMaterialOptions;
}