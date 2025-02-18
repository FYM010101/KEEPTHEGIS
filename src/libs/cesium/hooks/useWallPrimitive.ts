import { GeometryInstance, WallGeometry, Cartesian3, Primitive, MaterialAppearance } from 'cesium';
import { useWallMaterial } from './useWallMaterial';
import type { WallParams } from '../types';

export function useWallPrimitive(params: WallParams) {
    const { positions, materialOptions } = params;

    // 创建材质
    const wallMaterial = useWallMaterial(materialOptions);

    // 创建几何体实例
    const wallInstance = new GeometryInstance({
        geometry: new WallGeometry({
            positions: Cartesian3.fromDegreesArrayHeights(positions),
        }),
    });

    // 创建 Primitive
    const wallPrimitive = new Primitive({
        geometryInstances: wallInstance,
        appearance: new MaterialAppearance({
            material: wallMaterial,
        }),
    });

    return wallPrimitive;
}