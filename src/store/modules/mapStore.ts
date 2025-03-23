// 创建用户相关的小仓库
import { defineStore } from 'pinia';
import * as Cesium from 'cesium';
import { constantRoute } from '@/router/routes'
import { ref, Ref } from 'vue';

import type { WallParams, WallMaterialOptions, StreamerLineMaterialOptions } from '@/libs/cesium/types';
import * as VueCesium from '@/libs/cesium'
// 导入GeoJSON加载模块
import { useGeoJsonLoader, GeoJsonLoadOptions } from '@/libs/cesium/hooks/dataSource/useGeoJsonLoader';
// 导入3D Tiles加载模块
import { useTilesetLoader, TilesetLoadOptions } from '@/libs/cesium/hooks/dataSource/useTilesetLoader';
import { useWallEffect, WallEffectOptions } from '@/libs/cesium/hooks/useWallEffect';
import { useWaterMaterial, WaterMaterialOptions } from '@/libs/cesium/hooks/material/useWaterMaterial';

import { useStreamerLineEffect, StreamerLineEffectOptions } from '@/libs/cesium/hooks/useStreamerLineEffect';

import regionDataService from '@/services/regionDataService';
// 创建GeoJSON加载器实例
const geoJsonLoader = useGeoJsonLoader();
// 创建3D Tiles加载器实例
const tilesetLoader = useTilesetLoader();

const wallEffect = useWallEffect();

const streamerLineEffect = useStreamerLineEffect();

const { loadVehicle, removeVehicle } = VueCesium.useVehicleAnimation();

const { initPopup, clearPopup } = VueCesium.usePopup();


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
interface ViewConfig {
  id: string
  name: string
  position: Cesium.Cartesian3
  heading: number
  pitch: number
  roll: number
}

interface MapState {
  viewer: Cesium.Viewer | null;
  viewerReady: boolean;
  viewConfigs: ViewConfig[];
  currentViewId: string | null;
  viewPanelVisible: boolean;
  isFlying: boolean;
  locations: Record<string, ViewOptions>;
  mapInfo: MapInfo;
  // 漫游相关状态
  isTourRunning: boolean;
  isPaused: boolean;
  currentTourIndex: number;
  tourSpeed: number;
  tourProgress: number;
  carEntity: Cesium.Entity | null;
  carEntityId: string | null;
}

// 定义 Pinia Store
const useMapStore = defineStore('mapStore', {
  state: (): MapState => {
    return {
      viewer: null, // Cesium Viewer 实例
      viewerReady: false,
      viewConfigs: [],
      currentViewId: null,
      viewPanelVisible: false,
      carEntity: null,
      carEntityId: null,
      isFlying: false,
      locations: Object.freeze({
        '/home': {
          destination: Cesium.Cartesian3.fromDegrees(105, 30.5, 10159568),
          orientation: {
            heading: Cesium.Math.toRadians(0.0),
            pitch: Cesium.Math.toRadians(-90.0),
            roll: 0.0
          }
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
      },
      // 漫游相关状态
      isTourRunning: false,
      isPaused: false,
      currentTourIndex: 0,
      tourSpeed: 1.0,
      tourProgress: 0
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

    addViewConfig(config: Omit<ViewConfig, 'id'>) {
      const newConfig = { ...config, id: `view_${Date.now()}` }
      this.viewConfigs.push(newConfig)
      console.log(this.viewConfigs);
    },
    removeViewConfig(id: string) {
      this.viewConfigs = this.viewConfigs.filter(v => v.id !== id)
    },
    reorderViews(newOrder: ViewConfig[]) {
      this.viewConfigs = newOrder
      // // this.$patch({
      // //   viewConfigs: [...newOrder] // 保持数组引用变化
      // // });
      // this.viewConfigs = [...newOrder];
    },

    flyToView(id: string) {
      const config = this.viewConfigs.find(v => v.id === id);
      console.log(config);
      if (config && this.viewer) {
        const viewOptions: ViewOptions = {
          destination: config.position,
          orientation: {
            heading: config.heading,
            pitch: config.pitch,
            roll: config.roll
          }
        };
        this.setView(viewOptions);
      }
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
        // onClick: (entity: Cesium.Entity) => {
        //   this.handleRegionClick(entity);
        // }
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
        console.log(entity);
        // 获取区域ID，通常GeoJSON中会有adcode或id属性
        // 修复getValue方法的参数类型问题
        // const adcode = entity.properties.getValue(Cesium.JulianDate.now(), 'adcode') ||
        //   entity.properties.getValue(Cesium.JulianDate.now(), 'id') ||
        //   entity.properties.getValue(Cesium.JulianDate.now(), 'code');
        const adcode = entity.properties.adcode._value;
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
    createStreamerLineEffect(options: StreamerLineEffectOptions) {
      if (!this.viewer) return;
      streamerLineEffect.addStreamerLine(this.viewer, options);
    },
    removeStreamerLineEffect(id: string) {
      if (!this.viewer) return;
      streamerLineEffect.removeLine(this.viewer, id);
    },
    removeAllStreamerLineEffect() {
      if (!this.viewer) return;
      streamerLineEffect.removeAllLine(this.viewer);
    },
    updateStreamerLineMaterial(id: string, options: StreamerLineMaterialOptions) {
      streamerLineEffect.updateStreamerLineMaterial(id, options);
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
          type: 'wall',
          color: new Cesium.Color(0.0, 0.5, 0.7, 1.0),
          rate: 2,
          repeatNum: 5,
        }
      });

      let linePostions1 = [
        121.54383710651683, 25.04158767318846, 121.54886660576454,
        25.041520778338935, 121.5489302661648, 25.037809764195416,
        121.55763292042423, 25.037610190383617,
      ];
      let linePostions2 = [
        121.55375466873483, 25.044150811019648, 121.55544465416511,
        25.037715002796432, 121.54867305622793, 25.037870016863494,
        121.54871015658512, 25.033391988086763,
      ];
      let linePostions3 = [
        121.54896133676533, 25.044688605691732, 121.54907493228905,
        25.041491821748266, 121.55760945852529, 25.041291233041818,
        121.55747389009491, 25.033084480003765, 121.543669229817,
        25.033348047963145, 121.54380690184257, 25.038091540100325,
        121.54874670371714, 25.03798076751336, 121.54905974002901,
        25.044688605691732, 121.54652610721564, 25.04506985487869,
        121.54386854531765, 25.044935266844632, 121.54368432924542,
        25.03824665858879, 121.5575974570097, 25.037847869365393,
        121.55782052058595, 25.04495769594847, 121.55375546574658,
        25.044262809177837, 121.54905987101426, 25.044733445131712,
      ];
      let linePostions4 = [
        121.55247102172734, 25.033294114977295, 121.5525021244456,
        25.036184694941213, 121.5511111493363, 25.037979511647478,
        121.54379246879625, 25.038023901030698, 121.54384621066026,
        25.041653508137443, 121.5461551006216, 25.041497151878872,
        121.54599566446967, 25.0379573182758, 121.55297123215576,
        25.03793512578399, 121.55298088865737, 25.04145248665732,
        121.55296365188275, 25.044138703413196,
      ];
      let linePostions5 = [
        121.54375455026866, 25.036029857442244, 121.54610032336575,
        25.035985626035824, 121.54598728823271, 25.03340416800252,
        121.54881491346185, 25.033382155659254, 121.54878833220863,
        25.035565602229056, 121.55252458735305, 25.035344663858893,
        121.55250253652764, 25.036361704627197, 121.55299202722222,
        25.036605184507167, 121.55292156212147, 25.037668884495375,
        121.55566169439066, 25.0375801655385, 121.55560211090364,
        25.035499311540576, 121.55739387018264, 25.033206088198455,
      ];
      let lines = [linePostions1, linePostions2, linePostions3, linePostions4, linePostions5];
      for (let i = 0; i < lines.length; i++) {
        this.createStreamerLineEffect({
          id: 'line' + i,
          positions: lines[i],
          width: 5.0,
          materialOptions: {
            type: 'streamerLine',
            color: Cesium.Color.fromCssColorString("#7ffeff"),
            image: '/textures/line1.png',
            speed: 5.0,
          }
        });
      }
      this.loadXFC();
      this.loadPopup();
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
    },

    // 相机漫游功能 - 开始漫游
    startCameraTour() {
      if (!this.hasViewer() || this.viewConfigs.length < 2) {
        console.error('无法开始漫游：Viewer未初始化或视角点不足');
        return;
      }

      // 如果已经在漫游中，先停止
      if (this.isTourRunning) {
        this.stopCameraTour();
      }

      // 重置漫游状态
      this.isTourRunning = true;
      this.isPaused = false;
      this.currentTourIndex = 0;
      this.tourProgress = 0;

      // 开始漫游
      this.flyToNextViewInTour();
    },

    // 暂停漫游
    pauseCameraTour() {
      if (!this.isTourRunning || this.isPaused) return;

      // 取消当前飞行
      if (this.isFlying && this.viewer) {
        this.viewer.camera.cancelFlight();
        this.isFlying = false;
      }

      this.isPaused = true;
    },

    // 继续漫游
    resumeCameraTour() {
      if (!this.isTourRunning || !this.isPaused) return;

      this.isPaused = false;
      this.flyToNextViewInTour();
    },

    // 停止漫游
    stopCameraTour() {
      // 取消当前飞行
      if (this.isFlying && this.viewer) {
        this.viewer.camera.cancelFlight();
        this.isFlying = false;
      }

      this.isTourRunning = false;
      this.isPaused = false;
      this.currentTourIndex = 0;
      this.tourProgress = 0;
    },

    // 设置漫游速度
    setTourSpeed(speed: number) {
      // 限制速度范围在0.5到5之间
      this.tourSpeed = Math.max(0.1, Math.min(5, speed));
    },

    // 飞向漫游中的下一个视角（平滑过渡版本）
    flyToNextViewInTour() {
      if (!this.isTourRunning || this.isPaused || !this.hasViewer()) return;

      // 如果已经浏览完所有视角，重新开始或停止
      if (this.currentTourIndex >= this.viewConfigs.length) {
        this.currentTourIndex = 0; // 循环播放
        // 或者停止漫游
        // this.stopCameraTour();
        // return;
      }

      // 获取当前视角配置
      const currentConfig = this.viewConfigs[this.currentTourIndex];
      if (!currentConfig) return;

      // 计算下一个视角索引（循环）
      const nextIndex = (this.currentTourIndex + 1) % this.viewConfigs.length;
      const nextConfig = this.viewConfigs[nextIndex];

      // 计算飞行持续时间（根据速度调整）
      const duration = 2.0 / this.tourSpeed;

      // 更新进度
      this.tourProgress = (this.currentTourIndex / this.viewConfigs.length) * 100;

      // 设置飞行状态
      this.isFlying = true;

      // 创建缓动函数，使相机移动更加自然
      const easingFunction = Cesium.EasingFunction.QUADRATIC_IN_OUT;

      // 计算中间点的数量（根据持续时间和帧率）
      const frameRate = 30; // 每秒30帧
      const totalFrames = Math.floor(duration * frameRate);

      // 当前帧索引
      let currentFrame = 0;

      // 保存初始相机状态
      const startPosition = Cesium.Cartesian3.clone(currentConfig.position);
      const startHeading = currentConfig.heading;
      const startPitch = currentConfig.pitch;
      const startRoll = currentConfig.roll;

      // 目标位置和方向
      const endPosition = nextConfig.position;
      const endHeading = nextConfig.heading;
      const endPitch = nextConfig.pitch;
      const endRoll = nextConfig.roll;

      // 创建动画帧回调函数
      const animationFrameCallback = () => {
        if (!this.isTourRunning || this.isPaused) {
          this.isFlying = false;
          return;
        }

        // 计算当前进度（0到1之间）
        const progress = currentFrame / totalFrames;

        // 应用缓动函数
        const easedProgress = easingFunction(progress);

        // 插值计算当前位置
        const currentPosition = new Cesium.Cartesian3();
        Cesium.Cartesian3.lerp(
          startPosition,
          endPosition,
          easedProgress,
          currentPosition
        );

        // 插值计算当前方向 - 使用角度差值计算，选择最短路径
        // 计算heading角度差值，判断顺时针还是逆时针旋转更短
        let deltaHeading = endHeading - startHeading;

        // 处理跨越0/360度边界的情况
        if (deltaHeading > Math.PI) {
          deltaHeading -= 2 * Math.PI; // 逆时针更短
        } else if (deltaHeading < -Math.PI) {
          deltaHeading += 2 * Math.PI; // 顺时针更短
        }

        // 计算heading角度差值，判断顺时针还是逆时针旋转更短
        let deltaRoll = endRoll - startRoll;

        // 处理跨越0/360度边界的情况
        if (deltaRoll > Math.PI) {
          deltaRoll -= 2 * Math.PI; // 逆时针更短
        } else if (deltaRoll < -Math.PI) {
          deltaRoll += 2 * Math.PI; // 顺时针更短
        }

        // 根据最短路径计算当前heading
        const currentHeading = startHeading + deltaHeading * easedProgress;

        const currentPitch = Cesium.Math.lerp(
          startPitch,
          endPitch,
          easedProgress
        );

        // const currentRoll = Cesium.Math.lerp(
        //   startRoll,
        //   endRoll,
        //   easedProgress
        // );
        const currentRoll = startRoll + deltaRoll * easedProgress;

        // 设置相机位置和方向
        this.viewer!.camera.setView({
          destination: currentPosition,
          orientation: {
            heading: currentHeading,
            pitch: currentPitch,
            roll: currentRoll
          }
        });

        // 增加帧索引
        currentFrame++;

        // 如果动画未完成，继续下一帧
        if (currentFrame <= totalFrames) {
          requestAnimationFrame(animationFrameCallback);
        } else {
          // 动画完成
          this.isFlying = false;

          // 确保最终位置精确匹配目标位置
          this.viewer!.camera.setView({
            destination: endPosition,
            orientation: {
              heading: endHeading,
              pitch: endPitch,
              roll: endRoll
            }
          });

          // 如果漫游仍在进行且未暂停，则延迟一段时间后飞向下一个视角
          if (this.isTourRunning && !this.isPaused) {
            const stayDuration = 0; // 不停留，直接进入下一个视角
            setTimeout(() => {
              this.currentTourIndex++;
              this.flyToNextViewInTour();
            }, stayDuration);
          }
        }
      };
      // 开始动画
      requestAnimationFrame(animationFrameCallback);
    },
    loadXFC() {
      if (!this.viewer) return;
      // 加载消防车并保存返回的ID
      loadVehicle(this.viewer, 'XFC', {
        modelUri: "/gltf/xiaofangche.gltf",
        scale: 10,
        minimumPixelSize: 32,
        pathPoints: [
          [121.54883989579417, 25.04435068135976, 1],
          [121.54891310254465, 25.041764022763047, 1],
          [121.54886429804492, 25.039707921882993, 1],
          [121.54886429804492, 25.037696004860265, 1],
          [121.55147533881802, 25.03767389569815, 1]
        ],
        duration: 360,
        multiplier: 20,
        showPath: false
      });
    },

    // 移除车辆动画
    removeXFC() {
      if (!this.viewer) return;
      // 如果有特定的车辆ID，则移除该车辆，否则移除所有车辆
      removeVehicle(this.viewer, 'XFC');
    },
    loadPopup() {
      if (!this.viewer) return;


      // 初始化
      const myPopup = initPopup(this.viewer, { className: 'custom-popup' });
      myPopup!.add({
        geometry: Cesium.Cartesian3.fromDegrees(121.554532, 25.039364, 30),
        content: {
          header: "事件提醒",
          content: `
              <div><span>事件名称：</span><span>某地点发生打架斗殴</span></div>
              <div><span>监控编号：</span><span>${parseInt(
            (Math.random() * 100).toString()
          )}</span></div>
              <div><span>发生时间：</span><span>2024-08-03 12:00:33</span></div>
              <div><span>案件等级：</span><span>紧急！</span></div>
                  `,
        },
        isclose: true,
      });

      myPopup!.add({
        // lon: "121.554532",
        // lat: "25.042364",
        geometry: Cesium.Cartesian3.fromDegrees(121.5463, 25.039775, 30),
        content: {
          header: "雷达扫描",
          content: `
              <div><span>扫描区域：</span><span>某市某区人民街道</span></div>
              <div><span>扫描编号：</span><span>${parseInt(
            (Math.random() * 100).toString()
          )}</span></div>
              <div><span>任务时间：</span><span>2024-08-03 14:00:33</span></div>
              <div><span>任务等级：</span><span>一般</span></div>
                  `,
        },
        isclose: true,
      });
    },
    removePopup() {
      clearPopup();
    },
  },

});
// 对外暴露获取小仓库方法
export default useMapStore;