import type { FeatureCollection, Geometry } from "geojson";

// 定义图层类型
export interface Layer {
    id: string;        // 图层唯一 ID
    name: string;      // 图层名称
    data: FeatureCollection | Geometry; // GeoJSON 数据
    visible: boolean;  // 是否可见
    style?: Record<string, any>; // 图层样式（可选）
}

// 定义状态类型
export interface LayerState {
    layers: Layer[];
}
