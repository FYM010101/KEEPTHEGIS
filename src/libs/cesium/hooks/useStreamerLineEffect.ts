import * as Cesium from 'cesium';
import type { StreamerLineParams, StreamerLineMaterialOptions } from '../types';
import { MaterialManager } from '../core/MaterialManager';

export interface StreamerLineEffectOptions extends StreamerLineParams {
  id: string;
}

export function useStreamerLineEffect() {
  const streamerLineMap = new Map<string, Cesium.Primitive>();

  const createStreamerLine = (params: StreamerLineParams): Cesium.Primitive => {
    const streamerLineMaterial = MaterialManager.instance.createMaterial({
      type: 'steamerLine',
      ...params.materialOptions
    });
    
    return new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.PolylineGeometry({
          positions: Cesium.Cartesian3.fromDegreesArray(params.positions),
          width: params.width,
        })
      }),
      appearance: new Cesium.PolylineMaterialAppearance({
        material: streamerLineMaterial
      })
    });
  };

  const addStreamerLine = (viewer: Cesium.Viewer, options: StreamerLineEffectOptions) => {
    if (streamerLineMap.has(options.id)) return;
    
    const streamerLine = createStreamerLine(options);
    viewer.scene.primitives.add(streamerLine);
    streamerLineMap.set(options.id, streamerLine);
  };

  const removeLine = (viewer: Cesium.Viewer, id: string) => {
    const streamerLine = streamerLineMap.get(id);
    if (streamerLine) {
      viewer.scene.primitives.remove(streamerLine);
      streamerLineMap.delete(id);
    }
  };
  const removeAllLine = (viewer: Cesium.Viewer) => {
    for (const id of streamerLineMap.keys()) {
      removeLine(viewer, id);
    }
  };

  const updateStreamerLineMaterial = (id: string, materialOptions: StreamerLineMaterialOptions) => {
    const streamerLine = streamerLineMap.get(id);
    if (streamerLine) {
      (streamerLine.appearance as Cesium.MaterialAppearance).material = MaterialManager.instance.createMaterial({
        ...materialOptions
      });
    }
  };

  return {
    addStreamerLine,
    removeLine,
    removeAllLine,
    updateStreamerLineMaterial,
    getAllStreamerLines: () => new Map(streamerLineMap)
  };
}