// 创建用户相关的小仓库
import { defineStore } from 'pinia';
import * as Cesium from 'cesium';
//@ts-ignore
import { constantRoute } from '@/router/routes'
// import { markRaw } from 'vue';

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
  viewer: Cesium.Viewer | null; // Cesium Viewer 实例
  isFlying: boolean;
  locations: Record<string, ViewOptions>
  mapInfo: MapInfo
}

// 定义 Pinia Store
const useMapStore = defineStore('mapStore', {
  state: (): MapState => {
    return {
      viewer: null, // Cesium Viewer 实例
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
        '/baseRender': {
          destination: Cesium.Cartesian3.fromDegrees(105, 28, 1000000),
          orientation: {
            heading: Cesium.Math.toRadians(0.0),
            pitch: Cesium.Math.toRadians(-50),
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
    initializeViewer(viewerInstance: Cesium.Viewer) {
      if (this.viewer) {
        console.warn('Viewer 已初始化');
        return;
      }
      this.viewer = viewerInstance;
    },

    // 切换视角
    setView(viewOptions: ViewOptions) {
      if (!this.viewer) {
        console.error('Viewer 未初始化');
        return;
      }
      // 取消正在进行的飞行
      if (this.isFlying) {
        this.viewer.camera.cancelFlight();
        this.isFlying = false;
      }

      this.isFlying = true;
      this.viewer.camera.flyTo({
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
  },
});

// 对外暴露获取小仓库方法
export default useMapStore;