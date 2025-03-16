import * as Cesium from 'cesium';
import { ref, Ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

/**
 * 车辆动画配置选项
 */
export interface VehicleAnimationOptions {
    /** 模型URI路径 */
    modelUri: string;
    /** 模型缩放比例 */
    scale?: number;
    /** 最小像素大小 */
    minimumPixelSize?: number;
    /** 路径点数组，格式为[经度, 纬度, 高度(可选)] */
    pathPoints: [number, number, number?][];
    /** 总动画时长(秒) */
    duration?: number;
    /** 动画速度倍率 */
    multiplier?: number;
    /** 是否显示路径 */
    showPath?: boolean;
    /** 路径材质选项 */
    pathMaterial?: any;
    /** 路径宽度 */
    pathWidth?: number;
    /** 动画循环模式 */
    clockRange?: Cesium.ClockRange;
}

/**
 * 车辆动画管理器
 * 用于管理Cesium场景中的车辆动画，支持多车辆管理
 */
export function useVehicleAnimation() {
    // const vehicleEntities = ref<Cesium.Entity[]>([]);
    // 使用Map存储ID与实体的映射关系
    const entityMap = ref<Map<string, Cesium.Entity>>(new Map());
    /**
     * 加载车辆动画
     * @param options 车辆动画配置选项
     * @param id 可选的实体ID，如不提供则自动生成
     * @returns 创建的实体ID
     */
    const loadVehicle = (viewer: Cesium.Viewer, id: string, options: VehicleAnimationOptions): string | null => {
        const {
            modelUri,
            scale = 10,
            minimumPixelSize = 32,
            pathPoints,
            duration = 360,
            multiplier = 20,
            showPath = false,
            pathMaterial,
            pathWidth = 1,
            clockRange = Cesium.ClockRange.LOOP_STOP
        } = options;

        // 验证路径点
        if (!pathPoints || pathPoints.length < 2) {
            console.error('路径点数量不足，至少需要2个点');
            return null;
        }

        // 创建时间点
        let start = Cesium.JulianDate.fromDate(new Date());
        start = Cesium.JulianDate.addHours(start, 1, new Cesium.JulianDate());

        // 计算每段路径的时间间隔
        const timeStep = duration / (pathPoints.length - 1);
        const timePoints: Cesium.JulianDate[] = [];

        // 生成时间点数组
        for (let i = 0; i < pathPoints.length; i++) {
            const timePoint = Cesium.JulianDate.addSeconds(
                start,
                i * timeStep,
                new Cesium.JulianDate()
            );
            timePoints.push(timePoint);
        }

        // 结束时间
        const stop = timePoints[timePoints.length - 1];

        // 设置时钟范围
        viewer.clock.startTime = start.clone();
        viewer.clock.stopTime = stop.clone();
        viewer.clock.currentTime = start.clone();
        viewer.clock.clockRange = clockRange;
        viewer.clock.multiplier = multiplier;

        // 设置时间线边界
        if (viewer.timeline) {
            viewer.timeline.zoomTo(start, stop);
        }

        // 创建位置采样属性
        const position = new Cesium.SampledPositionProperty();

        // 添加位置采样点
        for (let i = 0; i < pathPoints.length; i++) {
            const point = pathPoints[i];
            const cartesian = Cesium.Cartesian3.fromDegrees(
                point[0],
                point[1],
                point[2] || 0
            );
            position.addSample(timePoints[i], cartesian);
        }

        // 创建车辆实体
        const vehicleEntity = viewer.entities.add({
            availability: new Cesium.TimeIntervalCollection([
                new Cesium.TimeInterval({
                    start: start,
                    stop: stop,
                }),
            ]),
            position: position,
            orientation: new Cesium.VelocityOrientationProperty(position),
            model: {
                uri: modelUri,
                scale: scale,
                minimumPixelSize: minimumPixelSize,
            },
            path: {
                show: showPath,
                material: pathMaterial,
                width: pathWidth
            },
        });

        // 生成或使用提供的ID
        const entityId = id || uuidv4();

        // 添加到实体列表和映射
        // vehicleEntities.value.push(vehicleEntity);
        entityMap.value.set(entityId, vehicleEntity);
        console.log('>>>车辆实体', entityMap.value);

        return entityId;
    };

    // /**
    //  * 加载消防车动画示例
    //  * 与原loadXFC方法功能相同
    //  * @param id 可选的实体ID，如不提供则自动生成
    //  * @returns 创建的实体ID
    //  */
    // const loadFireTruck = (id: string): string | null => {
    //     return loadVehicle(viewer, id, {
    //         modelUri: "/gltf/xiaofangche.gltf",
    //         scale: 10,
    //         minimumPixelSize: 32,
    //         pathPoints: [
    //             [121.54883989579417, 25.04435068135976, 1],
    //             [121.54891310254465, 25.041764022763047, 1],
    //             [121.54886429804492, 25.039707921882993, 1],
    //             [121.54886429804492, 25.037696004860265, 1],
    //             [121.55147533881802, 25.03767389569815, 1]
    //         ],
    //         duration: 360,
    //         multiplier: 20,
    //         showPath: false
    //     });
    // };

    /**
     * 移除指定的车辆实体
     * @param entityId 要移除的车辆实体ID
     * @returns 是否成功移除
     */
    const removeVehicle = (viewer: Cesium.Viewer, entityId: string): boolean => {
        if (!viewer) return false;

        const entity = entityMap.value.get(entityId);
        console.log('>>>删除车辆实体', entity);
        if (!entity) return false;

        viewer.entities.remove(entity);
        // vehicleEntities.value = vehicleEntities.value.filter(e => e !== entity);
        entityMap.value.delete(entityId);

        return true;
    };

    /**
     * 移除所有车辆实体
     */
    const removeAllVehicles = (viewer: Cesium.Viewer): void => {
        if (!viewer) return;

        // vehicleEntities.value.forEach(entity => {
        //     viewer.entities.remove(entity);
        // });

        // vehicleEntities.value = [];
        entityMap.value.clear();
    };

    /**
     * 暂停所有车辆动画
     */
    const pauseAnimation = (viewer: Cesium.Viewer): void => {
        if (!viewer) return;
        viewer.clock.shouldAnimate = false;
    };

    /**
     * 恢复所有车辆动画
     */
    const resumeAnimation = (viewer: Cesium.Viewer): void => {
        if (!viewer) return;
        viewer.clock.shouldAnimate = true;
    };

    /**
     * 设置动画速度
     * @param multiplier 速度倍率
     */
    const setAnimationSpeed = (viewer: Cesium.Viewer, multiplier: number): void => {
        if (!viewer) return;
        viewer.clock.multiplier = multiplier;
    };

    /**
     * 根据ID获取车辆实体
     * @param entityId 实体ID
     * @returns 对应的实体对象，不存在则返回null
     */
    const getVehicleById = (entityId: string): Cesium.Entity | null => {
        return entityMap.value.get(entityId) || null;
    };

    return {
        // vehicleEntities,
        entityMap,
        loadVehicle,
        // loadFireTruck,
        removeVehicle,
        removeAllVehicles,
        pauseAnimation,
        resumeAnimation,
        setAnimationSpeed,
        getVehicleById
    };
}