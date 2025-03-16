import type { Color } from 'cesium';
// 基础材质配置
export interface BaseMaterialOptions {
    type: string;
    uniforms?: Record<string, any>;
    cacheKey?: string;
}

// 墙面材质配置
export interface WallMaterialOptions extends BaseMaterialOptions {
    type: 'wall';
    color?: Color;
    rate?: number;
    repeatNum?: number;
}
// 地板材质配置
export interface StreamerLineMaterialOptions extends BaseMaterialOptions {
    type: 'streamerLine';
    color?: Color;
    image?: string;
    speed?: number;
}