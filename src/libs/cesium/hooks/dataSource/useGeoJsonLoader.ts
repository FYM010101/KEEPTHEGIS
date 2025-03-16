import * as Cesium from 'cesium';

// GeoJSON加载选项接口
export interface GeoJsonLoadOptions {
  url: string;
  stroke?: Cesium.Color;
  fill?: Cesium.Color;
  strokeWidth?: number;
  clampToGround?: boolean;
  markerSymbol?: string;
  markerColor?: Cesium.Color;
  markerSize?: number;
  onLoad?: (dataSource: Cesium.GeoJsonDataSource) => void;
  // onClick?: (entity: Cesium.Entity) => void; // 添加点击回调
}

// 默认选项
const defaultOptions: Partial<GeoJsonLoadOptions> = {
  stroke: Cesium.Color.WHITE,
  fill: new Cesium.Color(0, 0.4, 0.5, 0.3),
  strokeWidth: 2,
  clampToGround: false
};

/**
 * GeoJSON数据加载器
 * @returns GeoJSON数据加载相关方法
 */
export function useGeoJsonLoader() {
  // 存储已加载的数据源
  const loadedDataSources: Map<string, Cesium.GeoJsonDataSource> = new Map();

  /**
   * 加载GeoJSON数据
   * @param viewer Cesium Viewer实例
   * @param options GeoJSON加载选项
   * @returns 返回加载的GeoJsonDataSource实例的Promise
   */
  const load = async (
    viewer: Cesium.Viewer,
    options: Partial<GeoJsonLoadOptions> = {}
  ): Promise<Cesium.GeoJsonDataSource | null> => {
    if (!viewer) {
      console.error('Viewer未初始化');
      return null;
    }

    // 合并默认选项
    const mergedOptions = {
      ...defaultOptions,
      url: '/data/geojson/china.geojson',
      ...options
    };

    try {
      // 检查是否已加载过该URL的数据
      if (loadedDataSources.has(mergedOptions.url)) {
        return loadedDataSources.get(mergedOptions.url)!;
      }

      // 加载GeoJSON数据
      const dataSource = await Cesium.GeoJsonDataSource.load(mergedOptions.url, {
        stroke: mergedOptions.stroke,
        fill: mergedOptions.fill,
        strokeWidth: mergedOptions.strokeWidth,
        clampToGround: mergedOptions.clampToGround,
        markerSymbol: mergedOptions.markerSymbol,
        markerColor: mergedOptions.markerColor,
        markerSize: mergedOptions.markerSize
      });

      // 添加到viewer
      await viewer.dataSources.add(dataSource);

      // 存储数据源
      loadedDataSources.set(mergedOptions.url, dataSource);

      // 如果有回调函数，执行回调
      if (mergedOptions.onLoad) {
        mergedOptions.onLoad(dataSource);
      }
      // 如果提供了点击回调，设置点击事件
      // if (mergedOptions.onClick) {
      //   setupClickHandler(viewer, dataSource, mergedOptions.onClick);
      // }

      return dataSource;
    } catch (error) {
      console.error('加载GeoJSON数据失败:', error);
      return null;
    }
  };
//   /**
//  * 设置点击事件处理
//  * @param viewer Cesium Viewer实例
//  * @param dataSource GeoJSON数据源
//  * @param callback 点击回调函数
//  */
//   const setupClickHandler = (
//     viewer: Cesium.Viewer,
//     dataSource: Cesium.GeoJsonDataSource
//   ) => {
//     // 创建事件处理器
//     const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

//     // 设置左键点击事件
//     handler.setInputAction((movement: any) => {
//       const pickedObject = viewer.scene.pick(movement.position);

//       if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
//         const entity = pickedObject.id;

//         // 检查实体是否属于当前数据源
//         if (dataSource.entities.contains(entity)) {
//           callback(entity);
//         }
//       }
//     }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

//     // 存储事件处理器，以便后续可能的清理
//     // if (!viewer.screenSpaceEventHandlers) {
//     //   viewer.screenSpaceEventHandlers = [];
//     // }
//     // viewer.screenSpaceEventHandlers.push(handler);
//   };

  /**
   * 移除指定URL的GeoJSON数据
   * @param viewer Cesium Viewer实例
   * @param url GeoJSON数据URL
   */
  const remove = (viewer: Cesium.Viewer, url: string): boolean => {
    if (!viewer) {
      console.error('Viewer未初始化');
      return false;
    }

    const dataSource = loadedDataSources.get(url);
    if (dataSource) {
      viewer.dataSources.remove(dataSource);
      loadedDataSources.delete(url);
      return true;
    }
    return false;
  };

  /**
   * 移除所有已加载的GeoJSON数据
   * @param viewer Cesium Viewer实例
   */
  const removeAll = (viewer: Cesium.Viewer): void => {
    if (!viewer) {
      console.error('Viewer未初始化');
      return;
    }

    loadedDataSources.forEach(dataSource => {
      viewer.dataSources.remove(dataSource);
    });
    loadedDataSources.clear();
  };

  /**
   * 获取已加载的GeoJSON数据源
   * @param url GeoJSON数据URL
   */
  const getDataSource = (url: string): Cesium.GeoJsonDataSource | undefined => {
    return loadedDataSources.get(url);
  };

  /**
   * 获取所有已加载的GeoJSON数据源
   */
  const getAllDataSources = (): Map<string, Cesium.GeoJsonDataSource> => {
    return new Map(loadedDataSources);
  };

  return {
    load,
    remove,
    removeAll,
    getDataSource,
    getAllDataSources
  };
}