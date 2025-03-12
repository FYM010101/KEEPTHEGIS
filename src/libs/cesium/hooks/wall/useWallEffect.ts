import * as Cesium from 'cesium';
import { useWallMaterial } from '../material/useWallMaterial';
import type { WallParams, WallMaterialOptions } from '../../types';

export interface WallEffectOptions extends WallParams {
  id: string;
}

export function useWallEffect() {
  const wallMap = new Map<string, Cesium.Primitive>();

  const createWall = (params: WallParams): Cesium.Primitive => {
    const wallMaterial = useWallMaterial(params.materialOptions);
    
    return new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.WallGeometry({
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(params.positions)
        })
      }),
      appearance: new Cesium.MaterialAppearance({
        material: wallMaterial
      })
    });
  };

  const addWall = (viewer: Cesium.Viewer, options: WallEffectOptions) => {
    if (wallMap.has(options.id)) return;
    
    const wall = createWall(options);
    viewer.scene.primitives.add(wall);
    wallMap.set(options.id, wall);
  };

  const removeWall = (viewer: Cesium.Viewer, id: string) => {
    const wall = wallMap.get(id);
    if (wall) {
      viewer.scene.primitives.remove(wall);
      wallMap.delete(id);
    }
  };

  const updateWallMaterial = (id: string, materialOptions: WallMaterialOptions) => {
    const wall = wallMap.get(id);
    if (wall) {
      (wall.appearance as Cesium.MaterialAppearance).material = useWallMaterial(materialOptions);
    }
  };

  return {
    addWall,
    removeWall,
    updateWallMaterial,
    getAllWalls: () => new Map(wallMap)
  };
}