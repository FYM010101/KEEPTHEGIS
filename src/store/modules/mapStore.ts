// 创建用户相关的小仓库
import { defineStore } from 'pinia';
import * as Cesium from 'cesium';
import { constantRoute } from '@/router/routes'
import { ref, Ref } from 'vue';

import type { WallParams, WallMaterialOptions } from '@/libs/cesium/types';
import * as VueCesium from '@/libs/cesium'
// 导入GeoJSON加载模块
import { useGeoJsonLoader, GeoJsonLoadOptions } from '@/libs/cesium/hooks/dataSource/useGeoJsonLoader';
// 导入3D Tiles加载模块
import { useTilesetLoader, TilesetLoadOptions } from '@/libs/cesium/hooks/dataSource/useTilesetLoader';
import { useWallEffect, WallEffectOptions } from '@/libs/cesium/hooks/wall/useWallEffect';
import { useWaterMaterial, WaterMaterialOptions } from '@/libs/cesium/hooks/material/useWaterMaterial';

import regionDataService from '@/services/regionDataService';
// 创建GeoJSON加载器实例
const geoJsonLoader = useGeoJsonLoader();
// 创建3D Tiles加载器实例
const tilesetLoader = useTilesetLoader();

const wallEffect = useWallEffect();

// const { viewer } = VueCesium.useCesiumViewer("cesiumContainer");

// 定义视角选项类型
interface ViewOptions {
  destination: Cesium.Cartesian3 | Cesium.Rectangle; // 目标位置，可以是 Cartesian3 或 Rectangle
  orientation?: {
    heading?: number; // 方位角（弧度）
    pitch?: number;   // 俯仰角（弧度）
    roll?: number;    // 滚转角（弧度）
  };
  duration?: number;   // 动画持续时间（秒）
}

interface MapInfo {
  mouseLongitude: string, // 鼠标经度
  mouseLatitude: string,  // 鼠标纬度
  cameraLongitude: string, // 相机经度
  cameraLatitude: string,  // 相机纬度
  cameraHeight: string,        // 相机高度
  heading: string,             // 方位角
  pitch: string,               // 俯仰角
  roll: string,                // 滚动角
}

// 定义状态类型
interface MapState {
  viewer: Ref<Cesium.Viewer | null>; // Cesium Viewer 实例
  isFlying: boolean;
  locations: Record<string, ViewOptions>
  mapInfo: MapInfo
}

// 定义 Pinia Store
const useMapStore = defineStore('mapStore', {
  state: (): MapState => {
    return {
      viewer: ref<Cesium.Viewer | null>(null), // Cesium Viewer 实例
      isFlying: false,
      locations: Object.freeze({
        '/home': {
          destination: Cesium.Cartesian3.fromDegrees(105, 30.5, 10159568),
          orientation: {
            heading: Cesium.Math.toRadians(0.0),
            pitch: Cesium.Math.toRadians(-90.0),
            roll: 0.0
          },
        },
        '/mapEffects': {
          destination: Cesium.Cartesian3.fromDegrees(121.549884, 25.025771, 1050.6),
          orientation: {
            heading: Cesium.Math.toRadians(0.7),
            pitch: Cesium.Math.toRadians(-38.7),
            roll: 0.0
          }
        },
      }),
      mapInfo: {
        mouseLongitude: '0.000000',
        mouseLatitude: '0.000000',
        cameraLongitude: '0.000000',
        cameraLatitude: '0.000000',
        cameraHeight: '0.00',
        heading: '0.00',
        pitch: '0.00',
        roll: '0.00',
      }
    }
  },
  actions: {
    // 初始化 Cesium Viewer
    initializeViewer(viewerInstance: Ref<Cesium.Viewer | null>) {
      if (this.hasViewer()) {
        console.warn('Viewer 已初始化');
        return;
      }
      //@ts-ignore
      this.viewer = viewerInstance;
    },

    // 添加新方法：检查 viewer 是否已初始化
    hasViewer(): boolean {
      return this.viewer !== null && this.viewer !== undefined;
    },

    // 切换视角
    setView(viewOptions: ViewOptions) {
      if (!this.hasViewer()) {
        console.error('Viewer 未初始化');
        return;
      }
      // 取消正在进行的飞行
      if (this.isFlying) {
        this.viewer!.camera.cancelFlight();
        this.isFlying = false;
      }

      this.isFlying = true;
      this.viewer!.camera.flyTo({
        destination: viewOptions.destination,
        orientation: viewOptions.orientation,
        duration: viewOptions.duration || 2.0, // 动画持续时间，默认 2 秒
        complete: () => (this.isFlying = false),
        cancel: () => (this.isFlying = false),
      });
    },
    updateMousePosition(longitude: string, latitude: string) {
      this.mapInfo.mouseLongitude = longitude;
      this.mapInfo.mouseLatitude = latitude;
    },
    updateCameraParams(
      longitude: string,
      latitude: string,
      height: string,
      heading: string,
      pitch: string,
      roll: string
    ) {
      this.mapInfo.cameraLongitude = longitude;
      this.mapInfo.cameraLatitude = latitude;
      this.mapInfo.cameraHeight = height;
      this.mapInfo.heading = heading;
      this.mapInfo.pitch = pitch;
      this.mapInfo.roll = roll;
    },

    // // 加载 GeoJSON 数据
    async loadGeoJson(options?: Partial<GeoJsonLoadOptions>) {
      if (!this.hasViewer()) {
        console.error('Viewer 未初始化');
        return null;
      }

      // 合并选项，添加点击回调
      const mergedOptions = {
        ...options,
        onClick: (entity: Cesium.Entity) => {
          this.handleRegionClick(entity);
        }
      };

      const dataSource = await geoJsonLoader.load(this.viewer!, mergedOptions);

      if (dataSource) {
        // 设置地形深度测试
        this.viewer!.scene.globe.depthTestAgainstTerrain = false;
      }

      return dataSource;
    },
    // 处理区域点击事件
    handleRegionClick(entity: Cesium.Entity) {
      // 移除debugger语句
      if (entity && entity.properties) {
        // 获取区域ID，通常GeoJSON中会有adcode或id属性
        // 修复getValue方法的参数类型问题
        const adcode = entity.properties.getValue(Cesium.JulianDate.now(), 'adcode') ||
          entity.properties.getValue(Cesium.JulianDate.now(), 'id') ||
          entity.properties.getValue(Cesium.JulianDate.now(), 'code');
    
        if (adcode) {
          // 使用区域数据服务设置当前区域
          regionDataService.setCurrentRegion(adcode.toString());
        } else {
          console.warn('无法获取区域ID');
        }
      }
    },

    // 添加新方法：移除指定URL的GeoJSON数据
    removeGeoJson(url: string) {
      if (!this.hasViewer()) {
        console.error('Viewer 未初始化');
        return false;
      }

      return geoJsonLoader.remove(this.viewer!, url);
    },

    // 添加新方法：移除所有GeoJSON数据
    removeAllGeoJson() {
      if (!this.hasViewer()) {
        console.error('Viewer 未初始化');
        return;
      }

      geoJsonLoader.removeAll(this.viewer!);
    },

    // 添加新方法：获取已加载的GeoJSON数据源
    getGeoJsonDataSource(url: string) {
      return geoJsonLoader.getDataSource(url);
    },

    // 添加新方法：获取所有已加载的GeoJSON数据源
    getAllGeoJsonDataSources() {
      return geoJsonLoader.getAllDataSources();
    },

    // 修改3D Tiles加载方法，使用封装的模块
    async loadTileset(options?: Partial<TilesetLoadOptions>) {
      if (!this.hasViewer()) {
        console.error('Viewer 未初始化');
        return null;
      }

      return await tilesetLoader.load(this.viewer!, options);
    },

    // 添加新方法：移除指定URL的3D Tiles数据
    removeTileset(url: string) {
      if (!this.hasViewer()) {
        console.error('Viewer 未初始化');
        return false;
      }

      return tilesetLoader.remove(this.viewer!, url);
    },

    // 添加新方法：移除所有3D Tiles数据
    removeAllTilesets() {
      if (!this.hasViewer()) {
        console.error('Viewer 未初始化');
        return;
      }

      tilesetLoader.removeAll(this.viewer!);
    },

    // 添加新方法：应用自定义着色器
    applyCustomShader(url: string, shaderType: string = 'default') {
      return tilesetLoader.applyCustomShader(url, shaderType);
    },

    // 替换原来的loadsss方法
    async load3DTiles() {
      if (!this.hasViewer()) {
        console.error('Viewer 未初始化');
        return null;
      }

      const tileset = await this.loadTileset({
        url: '/data/tileset.json',
        customShader: tilesetLoader.createCustomShader('default')
      });

      return tileset;
    },
    createWallEffect(options: WallEffectOptions) {
      if (!this.viewer) return;
      wallEffect.addWall(this.viewer, options);
    },

    removeWallEffect(id: string) {
      if (!this.viewer) return;
      wallEffect.removeWall(this.viewer, id);
    },

    updateWallMaterial(id: string, options: WallMaterialOptions) {
      wallEffect.updateWallMaterial(id, options);
    },
    // 保留原来的loadEffectsData方法，但修改3D Tiles加载部分
    loadEffectsData() {
      this.viewer!.scene.globe.depthTestAgainstTerrain = true; //（开启）

      //加载3dtiles
      this.load3DTiles();

      //加载扫描系统（后处理）
      const scanSystem = VueCesium.useCircleScan({
        type: 'Circle',
        lon: 121.554532,
        lat: 25.039364,
        radius: 300,
        scanColor: new Cesium.Color(0.0, 1.0, 1.0, 0.8)
      });

      const raderSystem = VueCesium.useCircleScan({
        type: "Radar",
        lon: 121.5463,
        lat: 25.039775,
        radius: 200,
      });
      //primitive添加墙，着色器实现电子围栏效果
      // 定义墙体参数
      let data = [
        [121.5435972916668, 25.03335124407222, 100.0],
        [121.55758689992729, 25.03305850196061, 100.0],
        [121.5578765706079, 25.045082938309875, 100.0],
        [121.55308216929683, 25.044389044803737, 100.0],
        [121.54911574643842, 25.04483902108565, 100.0],
        [121.54648299411446, 25.045158015241427, 100.0],
        [121.54397513270857, 25.04493282041925, 100.0],
        [121.54359717389292, 25.033369546587437, 100.0],
      ];
      let positions = Array.prototype.concat.apply([], data);
      this.createWallEffect({
        id: 'mainWall',
        positions: positions,
        materialOptions: {
          color: new Cesium.Color(0.0, 0.5, 0.7, 1.0),
          rate: 2,
          repeatNum: 5,
        }
      });
    },
    /**
 * 创建水面效果
 * @param rectangle 水面范围（经纬度）
 * @param options 材质选项
 */
    createWaterEffect(rectangle: Cesium.Rectangle, options?: WaterMaterialOptions) {
      if (!this.hasViewer()) {
        console.error('Viewer 未初始化');
        return null;
      }

      const waterMaterial = useWaterMaterial(options || {});

      const waterPrimitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.RectangleGeometry({
            rectangle: rectangle,
            vertexFormat: Cesium.VertexFormat.POSITION_AND_ST
          })
        }),
        appearance: new Cesium.MaterialAppearance({
          material: waterMaterial
        })
      });

      this.viewer!.scene.primitives.add(waterPrimitive);
      return waterPrimitive;
    }
  },
});

// 对外暴露获取小仓库方法
export default useMapStore;