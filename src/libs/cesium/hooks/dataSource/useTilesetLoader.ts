import * as Cesium from 'cesium';

// 3D Tiles加载选项接口
export interface TilesetLoadOptions {
  url: string;
  position?: Cesium.Cartesian3;
  scale?: number;
  maximumScreenSpaceError?: number;
  customShader?: Cesium.CustomShader | null;
  onLoad?: (tileset: Cesium.Cesium3DTileset) => void;
}

// 默认选项
const defaultOptions: Partial<TilesetLoadOptions> = {
  maximumScreenSpaceError: 16,
  scale: 1.0
};

/**
 * 创建自定义着色器
 * @param type 着色器类型
 * @returns 自定义着色器实例
 */
export function createCustomShader(type: string = 'default'): Cesium.CustomShader {
  switch (type) {
    case 'colorByHeight':
      return new Cesium.CustomShader({
        fragmentShaderText: `
          void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
              vec3 positionMC = fsInput.attributes.positionMC;
              material.diffuse = vec3(1.0-positionMC.y*0.005, 1.0-positionMC.y*0.0015, 1.0-positionMC.y*0.0015);
          }`
      });
    case 'glowEffect':
      return new Cesium.CustomShader({
        fragmentShaderText: `
          void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
              vec3 positionMC = fsInput.attributes.positionMC;
              float _baseHeight = 18.0; 
              float _heightRange = 60.0; 
              float _glowRange = 120.0; 
              
              float vtxf_height = fsInput.attributes.positionMC.y - _baseHeight;
              float vtxf_a11 = fract(czm_frameNumber / 360.0) * 3.14159265 * 2.0;
              float vtxf_a12 = vtxf_height / _heightRange + sin(vtxf_a11) * 0.1;
              material.diffuse *= vec3(vtxf_a12, vtxf_a12, vtxf_a12);
              
              float vtxf_a13 = fract(czm_frameNumber / 360.0);
              float vtxf_h = clamp(vtxf_height / _glowRange, 0.0, 1.0);
              vtxf_a13 = abs(vtxf_a13 - 0.5) * 2.0;
              float vtxf_diff = step(0.01, abs(vtxf_h - vtxf_a13));
              material.diffuse += material.diffuse * (1.0 - vtxf_diff);
          }`
      });
    default:
      return new Cesium.CustomShader({
        fragmentShaderText: `
          void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
              vec3 positionMC = fsInput.attributes.positionMC;
              material.diffuse = vec3(1.0-positionMC.y*0.005, 1.0-positionMC.y*0.0015, 1.0-positionMC.y*0.0015);
          }`
      });
  }
}

/**
 * 3D Tiles数据加载器
 * @returns 3D Tiles数据加载相关方法
 */
export function useTilesetLoader() {
  // 存储已加载的3D Tiles
  const loadedTilesets: Map<string, Cesium.Cesium3DTileset> = new Map();
  
  /**
   * 加载3D Tiles数据
   * @param viewer Cesium Viewer实例
   * @param options 3D Tiles加载选项
   * @returns 返回加载的Cesium3DTileset实例的Promise
   */
  const load = async (
    viewer: Cesium.Viewer,
    options: Partial<TilesetLoadOptions> = {}
  ): Promise<Cesium.Cesium3DTileset | null> => {
    if (!viewer) {
      console.error('Viewer未初始化');
      return null;
    }
    
    // 合并默认选项
    const mergedOptions = { 
      ...defaultOptions, 
      url: '/data/tileset.json', 
      ...options 
    };
    
    try {
      // 检查是否已加载过该URL的数据
      if (loadedTilesets.has(mergedOptions.url)) {
        return loadedTilesets.get(mergedOptions.url)!;
      }
      
      // 加载3D Tiles数据
      const tileset = await Cesium.Cesium3DTileset.fromUrl(mergedOptions.url, {
        maximumScreenSpaceError: mergedOptions.maximumScreenSpaceError
      });
      
      // 设置位置和缩放
      if (mergedOptions.position) {
        const transform = Cesium.Matrix4.fromTranslation(mergedOptions.position);
        tileset.modelMatrix = transform;
      }
      
      if (mergedOptions.scale !== 1.0 && mergedOptions.scale !== undefined) {
        const scale = mergedOptions.scale;
        const scaleMatrix = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(scale, scale, scale));
        Cesium.Matrix4.multiply(tileset.modelMatrix, scaleMatrix, tileset.modelMatrix);
      }
      
      // 应用自定义着色器
      if (mergedOptions.customShader) {
        tileset.customShader = mergedOptions.customShader;
      }
      
      // 添加到viewer
      viewer.scene.primitives.add(tileset);
      
      // 存储3D Tiles
      loadedTilesets.set(mergedOptions.url, tileset);
      
      // 如果有回调函数，执行回调
      if (mergedOptions.onLoad) {
        mergedOptions.onLoad(tileset);
      }
      
      return tileset;
    } catch (error) {
      console.error('加载3D Tiles数据失败:', error);
      return null;
    }
  };
  
  /**
   * 移除指定URL的3D Tiles数据
   * @param viewer Cesium Viewer实例
   * @param url 3D Tiles数据URL
   */
  const remove = (viewer: Cesium.Viewer, url: string): boolean => {
    if (!viewer) {
      console.error('Viewer未初始化');
      return false;
    }
    
    const tileset = loadedTilesets.get(url);
    if (tileset) {
      viewer.scene.primitives.remove(tileset);
      loadedTilesets.delete(url);
      return true;
    }
    return false;
  };
  
  /**
   * 移除所有已加载的3D Tiles数据
   * @param viewer Cesium Viewer实例
   */
  const removeAll = (viewer: Cesium.Viewer): void => {
    if (!viewer) {
      console.error('Viewer未初始化');
      return;
    }
    
    loadedTilesets.forEach(tileset => {
      viewer.scene.primitives.remove(tileset);
    });
    loadedTilesets.clear();
  };
  
  /**
   * 获取已加载的3D Tiles
   * @param url 3D Tiles数据URL
   */
  const getTileset = (url: string): Cesium.Cesium3DTileset | undefined => {
    return loadedTilesets.get(url);
  };
  
  /**
   * 获取所有已加载的3D Tiles
   */
  const getAllTilesets = (): Map<string, Cesium.Cesium3DTileset> => {
    return new Map(loadedTilesets);
  };
  
  /**
   * 应用自定义着色器到指定的3D Tiles
   * @param url 3D Tiles数据URL
   * @param shaderType 着色器类型
   */
  const applyCustomShader = (url: string, shaderType: string = 'default'): boolean => {
    const tileset = loadedTilesets.get(url);
    if (tileset) {
      tileset.customShader = createCustomShader(shaderType);
      return true;
    }
    return false;
  };
  
  return {
    load,
    remove,
    removeAll,
    getTileset,
    getAllTilesets,
    applyCustomShader,
    createCustomShader
  };
}