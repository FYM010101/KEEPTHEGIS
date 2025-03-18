import { ref, Ref, onUnmounted } from 'vue';
import * as Cesium from 'cesium';
import useMapStore from '@/store/modules/mapStore';
import { eventBus } from '@/services/eventBus';

/**
 * 绘制模式枚举
 */
export enum DrawMode {
  NONE = 'none',
  POINT = 'point',
  LINE = 'line',
  POLYGON = 'polygon'
}

/**
 * 绘制实体类型
 */
export interface DrawEntity {
  id: string;
  entity: Cesium.Entity;
  type: DrawMode;
  positions: Cesium.Cartesian3[];
}

/**
 * 绘制点位类型
 */
export interface DrawPoint {
  id: string;
  entity: Cesium.Entity;
  position: Cesium.Cartesian3;
  parentId?: string; // 所属线或面的ID
}

/**
 * 绘制选项接口
 */
export interface DrawOptions {
  pointColor?: Cesium.Color;
  pointOutlineColor?: Cesium.Color;
  pointOutlineWidth?: number;
  pointPixelSize?: number;
  lineColor?: Cesium.Color;
  lineWidth?: number;
  polygonColor?: Cesium.Color;
  polygonOutlineColor?: Cesium.Color;
  polygonOutlineWidth?: number;
}

/**
 * 使用绘制功能的钩子函数
 * @returns 绘制相关方法和状态
 */
export function useDrawing() {
  const mapStore = useMapStore();
  const viewer = ref<Cesium.Viewer | null>(null);
  const drawMode = ref<DrawMode>(DrawMode.NONE);
  const isDrawing = ref<boolean>(false);
  const activeEntityId = ref<string | null>(null);
  const activePointId = ref<string | null>(null);
  const isDragging = ref<boolean>(false);
  
  // 存储绘制的实体
  const drawEntities = ref<DrawEntity[]>([]);
  const drawPoints = ref<DrawPoint[]>([]);
  
  // 临时实体（用于预览）
  const previewEntity = ref<Cesium.Entity | null>(null);
  
  // 事件处理器
  const handler = ref<Cesium.ScreenSpaceEventHandler | null>(null);
  
  // 默认绘制选项
  const defaultOptions: DrawOptions = {
    pointColor: Cesium.Color.RED,
    pointOutlineColor: Cesium.Color.WHITE,
    pointOutlineWidth: 2,
    pointPixelSize: 10,
    lineColor: Cesium.Color.DODGERBLUE.withAlpha(0.7),
    lineWidth: 3,
    polygonColor: Cesium.Color.DODGERBLUE.withAlpha(0.3),
    polygonOutlineColor: Cesium.Color.DODGERBLUE,
    polygonOutlineWidth: 2
  };
  
  const options = ref<DrawOptions>(defaultOptions);
  
  /**
   * 初始化绘制功能
   * @param cesiumViewer Cesium Viewer实例
   * @param drawOptions 绘制选项
   */
  const initDrawing = (cesiumViewer: Cesium.Viewer, drawOptions?: DrawOptions) => {
    viewer.value = cesiumViewer;
    if (drawOptions) {
      options.value = { ...defaultOptions, ...drawOptions };
    }
    
    // 初始化事件处理器
    if (handler.value) {
      handler.value.destroy();
    }
    handler.value = new Cesium.ScreenSpaceEventHandler(viewer.value.canvas);
    
    // 设置事件监听
    setupEventHandlers();
  };
  
  /**
   * 设置事件处理器
   */
  const setupEventHandlers = () => {
    if (!handler.value || !viewer.value) return;
    
    // 左键点击事件
    handler.value.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      if (!isDrawing.value && drawMode.value === DrawMode.NONE) return;
      
      const cartesian = getCartesianFromScreenCoordinates(event.position);
      if (!cartesian) return;
      
      // 如果正在绘制
      if (isDrawing.value) {
        switch (drawMode.value) {
          case DrawMode.POINT:
            addPoint(cartesian);
            break;
          case DrawMode.LINE:
          case DrawMode.POLYGON:
            addPositionToActiveEntity(cartesian);
            break;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    
    // 鼠标移动事件
    handler.value.setInputAction((event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (!isDrawing.value && !isDragging.value) return;
      
      const cartesian = getCartesianFromScreenCoordinates(event.endPosition);
      if (!cartesian) return;
      
      // 如果正在拖动点位
      if (isDragging.value && activePointId.value) {
        updatePointPosition(activePointId.value, cartesian);
        return;
      }
      
      // 如果正在绘制，更新预览
      if (isDrawing.value && (drawMode.value === DrawMode.LINE || drawMode.value === DrawMode.POLYGON)) {
        updatePreview(cartesian);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    
    // 右键点击事件
    handler.value.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      // 如果正在绘制线或面，右键完成绘制
      if (isDrawing.value && (drawMode.value === DrawMode.LINE || drawMode.value === DrawMode.POLYGON)) {
        finishDrawing();
      } else {
        // 检查是否点击了点位，如果是则删除
        const pickedObject = viewer.value!.scene.pick(event.position);
        if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
          const pointId = pickedObject.id.id as string;
          const point = drawPoints.value.find(p => p.id === pointId);
          if (point) {
            removePoint(pointId);
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    
    // 左键按下事件（用于开始拖动）
    handler.value.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const pickedObject = viewer.value!.scene.pick(event.position);
      if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
        const pointId = pickedObject.id.id as string;
        const point = drawPoints.value.find(p => p.id === pointId);
        if (point) {
          activePointId.value = pointId;
          isDragging.value = true;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    
    // 左键抬起事件（用于结束拖动）
    handler.value.setInputAction(() => {
      if (isDragging.value) {
        isDragging.value = false;
        activePointId.value = null;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
  };
  
  /**
   * 从屏幕坐标获取笛卡尔坐标
   * @param screenPosition 屏幕坐标
   * @returns 笛卡尔坐标
   */
  const getCartesianFromScreenCoordinates = (screenPosition: Cesium.Cartesian2): Cesium.Cartesian3 | undefined => {
    if (!viewer.value) return undefined;
    
    // 从场景中拾取坐标
    const ray = viewer.value.camera.getPickRay(screenPosition);
    if (!ray) return undefined;
    
    return viewer.value.scene.globe.pick(ray, viewer.value.scene);
  };
  
  /**
   * 开始绘制
   * @param mode 绘制模式
   */
  const startDrawing = (mode: DrawMode) => {
    // 如果已经在绘制中，先完成当前绘制
    if (isDrawing.value) {
      finishDrawing();
    }
    
    drawMode.value = mode;
    isDrawing.value = true;
    
    // 创建新的实体
    if (mode === DrawMode.LINE || mode === DrawMode.POLYGON) {
      createNewEntity(mode);
    }
  };
  
  /**
   * 停止绘制
   */
  const stopDrawing = () => {
    // 如果正在绘制，完成当前绘制
    if (isDrawing.value) {
      finishDrawing();
    }
    
    // 重置状态
    drawMode.value = DrawMode.NONE;
    isDrawing.value = false;
    activeEntityId.value = null;
    
    // 清除预览实体
    if (previewEntity.value && viewer.value) {
      viewer.value.entities.remove(previewEntity.value);
      previewEntity.value = null;
    }
  };
  
  /**
   * 完成当前绘制
   */
  const finishDrawing = () => {
    if (!isDrawing.value || !activeEntityId.value) return;
    
    // 对于多边形，确保至少有3个点
    if (drawMode.value === DrawMode.POLYGON) {
      const entity = drawEntities.value.find(e => e.id === activeEntityId.value);
      if (entity && entity.positions.length < 3) {
        // 如果点不够，不完成绘制
        return;
      }
    }
    
    // 重置绘制状态
    isDrawing.value = false;
    activeEntityId.value = null;
    
    // 清除预览实体
    if (previewEntity.value && viewer.value) {
      viewer.value.entities.remove(previewEntity.value);
      previewEntity.value = null;
    }
  };
  
  /**
   * 创建新的绘制实体
   * @param type 实体类型
   */
  const createNewEntity = (type: DrawMode.LINE | DrawMode.POLYGON) => {
    if (!viewer.value) return;
    
    const id = `draw-${type}-${Date.now()}`;
    let entity: Cesium.Entity;
    
    if (type === DrawMode.LINE) {
      entity = viewer.value.entities.add({
        id,
        polyline: {
          positions: new Cesium.CallbackProperty(() => {
            const entity = drawEntities.value.find(e => e.id === id);
            return entity ? entity.positions : [];
          }, false),
          width: options.value.lineWidth,
          material: options.value.lineColor,
          clampToGround: true
        }
      });
    } else { // POLYGON
      entity = viewer.value.entities.add({
        id,
        polygon: {
          hierarchy: new Cesium.CallbackProperty(() => {
            const entity = drawEntities.value.find(e => e.id === id);
            return entity ? new Cesium.PolygonHierarchy(entity.positions) : new Cesium.PolygonHierarchy([]);
          }, false),
          material: options.value.polygonColor,
          outline: true,
          outlineColor: options.value.polygonOutlineColor,
          outlineWidth: options.value.polygonOutlineWidth
        }
      });
    }
    
    // 添加到实体列表
    drawEntities.value.push({
      id,
      entity,
      type,
      positions: []
    });
    
    activeEntityId.value = id;
  };
  
  /**
   * 添加点位
   * @param position 点位坐标
   */
  const addPoint = (position: Cesium.Cartesian3) => {
    if (!viewer.value) return;
    
    const id = `draw-point-${Date.now()}`;
    const entity = viewer.value.entities.add({
      id,
      position,
      point: {
        color: options.value.pointColor,
        pixelSize: options.value.pointPixelSize,
        outlineColor: options.value.pointOutlineColor,
        outlineWidth: options.value.pointOutlineWidth,
        disableDepthTestDistance: Number.POSITIVE_INFINITY // 确保点位始终可见
      }
    });
    
    // 添加到点位列表
    drawPoints.value.push({
      id,
      entity,
      position
    });
    
    // 点绘制完成后重置状态
    if (drawMode.value === DrawMode.POINT) {
      isDrawing.value = false;
    }
    
    return id;
  };
  
  /**
   * 向活动实体添加位置点
   * @param position 位置坐标
   */
  const addPositionToActiveEntity = (position: Cesium.Cartesian3) => {
    if (!activeEntityId.value) return;
    
    const entityIndex = drawEntities.value.findIndex(e => e.id === activeEntityId.value);
    if (entityIndex === -1) return;
    
    // 添加位置到实体
    drawEntities.value[entityIndex].positions.push(position);
    
    // 为位置创建点实体
    const pointId = addPoint(position);
    if (pointId) {
      // 更新点位的父实体ID
      const pointIndex = drawPoints.value.findIndex(p => p.id === pointId);
      if (pointIndex !== -1) {
        drawPoints.value[pointIndex].parentId = activeEntityId.value;
      }
    }
}
    
    /**
     * 更新预览
     * @param position 当前鼠标位置
     */
    const updatePreview = (position: Cesium.Cartesian3) => {
      if (!viewer.value || !activeEntityId.value) return;
      
      const entity = drawEntities.value.find(e => e.id === activeEntityId.value);
      if (!entity || entity.positions.length === 0) return;
      
      // 如果预览实体不存在，创建它
      if (!previewEntity.value) {
        if (drawMode.value === DrawMode.LINE) {
          previewEntity.value = viewer.value.entities.add({
            polyline: {
              positions: new Cesium.CallbackProperty(() => {
                if (!entity || entity.positions.length === 0) return [];
                return [entity.positions[entity.positions.length - 1], position];
              }, false),
              width: options.value.lineWidth,
              material: options.value.lineColor?.withAlpha(0.5),
              clampToGround: true
            }
          });
        } else if (drawMode.value === DrawMode.POLYGON) {
          previewEntity.value = viewer.value.entities.add({
            polygon: {
              hierarchy: new Cesium.CallbackProperty(() => {
                if (!entity || entity.positions.length < 2) return new Cesium.PolygonHierarchy([]);
                
                // 创建一个包含所有现有点和当前鼠标位置的多边形
                const positions = [...entity.positions, position];
                return new Cesium.PolygonHierarchy(positions);
              }, false),
              material: options.value.polygonColor?.withAlpha(0.3),
              outline: true,
              outlineColor: options.value.polygonOutlineColor?.withAlpha(0.5),
              outlineWidth: options.value.polygonOutlineWidth
            }
          });
        }
      }
    };
    
    /**
     * 更新点位置
     * @param pointId 点ID
     * @param position 新位置
     */
    const updatePointPosition = (pointId: string, position: Cesium.Cartesian3) => {
      if (!viewer.value) return;
      
      // 更新点实体位置
      const pointIndex = drawPoints.value.findIndex(p => p.id === pointId);
      if (pointIndex === -1) return;
      
      // 更新点位置
      drawPoints.value[pointIndex].position = position;
      drawPoints.value[pointIndex].entity.position = new Cesium.ConstantPositionProperty(position);
      
      // 如果点属于线或面，更新对应实体的位置
      const parentId = drawPoints.value[pointIndex].parentId;
      if (parentId) {
        const entityIndex = drawEntities.value.findIndex(e => e.id === parentId);
        if (entityIndex !== -1) {
          // 找出点在实体位置数组中的索引
          const positions = drawEntities.value[entityIndex].positions;
          for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            // 找到对应的点位置并更新
            const pointEntity = drawPoints.value.find(p => 
              p.parentId === parentId && 
              Cesium.Cartesian3.equals(p.position, pos)
            );
            if (pointEntity && pointEntity.id === pointId) {
              positions[i] = position;
              break;
            }
          }
        }
      }
    };
    
    /**
     * 移除点位
     * @param pointId 点ID
     */
    const removePoint = (pointId: string) => {
      if (!viewer.value) return;
      
      const pointIndex = drawPoints.value.findIndex(p => p.id === pointId);
      if (pointIndex === -1) return;
      
      const point = drawPoints.value[pointIndex];
      const parentId = point.parentId;
      
      // 如果点属于线或面，从实体中移除该点
      if (parentId) {
        const entityIndex = drawEntities.value.findIndex(e => e.id === parentId);
        if (entityIndex !== -1) {
          const entity = drawEntities.value[entityIndex];
          
          // 找到点在位置数组中的索引
          let positionIndex = -1;
          for (let i = 0; i < entity.positions.length; i++) {
            if (Cesium.Cartesian3.equals(entity.positions[i], point.position)) {
              positionIndex = i;
              break;
            }
          }
          
          if (positionIndex !== -1) {
            // 从位置数组中移除该点
            entity.positions.splice(positionIndex, 1);
            
            // 如果是多边形且点数少于3，或者是线且点数少于2，则移除整个实体
            if ((entity.type === DrawMode.POLYGON && entity.positions.length < 3) ||
                (entity.type === DrawMode.LINE && entity.positions.length < 2)) {
              removeEntity(parentId);
            }
          }
        }
      }
      
      // 从点列表中移除点并从场景中删除
      viewer.value.entities.remove(point.entity);
      drawPoints.value.splice(pointIndex, 1);
    };
    
    /**
     * 移除实体
     * @param entityId 实体ID
     */
    const removeEntity = (entityId: string) => {
      if (!viewer.value) return;
      
      const entityIndex = drawEntities.value.findIndex(e => e.id === entityId);
      if (entityIndex === -1) return;
      
      const entity = drawEntities.value[entityIndex];
      
      // 移除所有关联的点
      const relatedPoints = drawPoints.value.filter(p => p.parentId === entityId);
      for (const point of relatedPoints) {
        viewer.value.entities.remove(point.entity);
      }
      drawPoints.value = drawPoints.value.filter(p => p.parentId !== entityId);
      
      // 移除实体
      viewer.value.entities.remove(entity.entity);
      drawEntities.value.splice(entityIndex, 1);
    };
    
    /**
     * 清除所有绘制内容
     */
    const clearAll = () => {
      if (!viewer.value) return;
      
      // 停止当前绘制
      stopDrawing();
      
      // 移除所有点
      for (const point of drawPoints.value) {
        viewer.value.entities.remove(point.entity);
      }
      drawPoints.value = [];
      
      // 移除所有实体
      for (const entity of drawEntities.value) {
        viewer.value.entities.remove(entity.entity);
      }
      drawEntities.value = [];
    };
    
    // 组件卸载时清理资源
    onUnmounted(() => {
      if (handler.value) {
        handler.value.destroy();
        handler.value = null;
      }
      
      clearAll();
    });
    
    return {
      drawMode,
      isDrawing,
      drawEntities,
      drawPoints,
      options,
      initDrawing,
      startDrawing,
      stopDrawing,
      finishDrawing,
      addPoint,
      removePoint,
      removeEntity,
      clearAll
    };
  }