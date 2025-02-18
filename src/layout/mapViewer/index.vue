<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';
//@ts-ignore
import * as VueCesium from '@/libs/cesium'
//@ts-ignore
import useMapStore from '@/store/modules/mapStore';
//@ts-ignore
import { useWallPrimitive } from '@/libs/cesium/hooks/useWallPrimitive';
//@ts-ignore
import type { WallParams } from '@/libs/cesium/types';


const { viewer } = VueCesium.useCesiumViewer("cesiumContainer");
const mapStore = useMapStore();
const cesiumLayers = VueCesium.useCesiumLayers();

let camera: Cesium.Camera;
let scene: Cesium.Scene;
let geoJsonDataSource: Cesium.GeoJsonDataSource;
const highlightedFeature = { feature: null as Cesium.Entity | null };

let defaultFillColor = new Cesium.Color(0, 0.4, 0.5, 0.6);
let selectedColor = new Cesium.Color(1, 1, 0, 0.5);
async function initCesium() {
    camera = viewer.value.camera;
    scene = viewer.value.scene;
    // viewer.scene.globe.depthTestAgainstTerrain = true;

    //接入天地图wmts服务
    cesiumLayers.addLayer('http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=22405d420b3bd1d7c7fdde8fb168c4c7', {
        subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
        layer: 'tdtImgLayer',
        style: 'default',
        format: 'image/jpeg',
        tileMatrixSetID: 'GoogleMapsCompatible',
        maximumLevel: 19,
    });

    //添加数据
    //添加官网点云数据
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(43978);
    scene.primitives.add(tileset);
    //中国geojson数据
    loadGeoJson();

    //primitive添加墙，着色器实现电子围栏效果
    // 定义墙体参数
    const wallParams: WallParams = {
        positions: [
            107.0, 41.0, 100000.0,
            97.0, 41.0, 100000.0,
            97.0, 38.0, 100000.0,
            107.0, 38.0, 100000.0,
            107.0, 41.0, 100000.0,
        ],
        materialOptions: {
            color: new Cesium.Color(1.0, 0.0, 0.0, 1.0), // 红色
            rate: 2,
            repeatNum: 5,
        },
    };

    // 创建墙体 Primitive
    const wallPrimitive = useWallPrimitive(wallParams);
    scene.primitives.add(wallPrimitive);
    // const redBox = {
    //     id: 'redBox',
    //     name: "红色方盒子",
    //     position: Cesium.Cartesian3.fromDegrees(105, 35, 50000.0),
    //     box: {
    //         dimensions: new Cesium.Cartesian3(80000.0, 60000.0, 100000.0),
    //         material: Cesium.Color.RED,
    //         outline: true,
    //         outlineColor: Cesium.Color.BLACK,
    //     },
    // }
    // viewer.entities.add(redBox);

    // const wall = {
    //     id: 'wall',
    //     name: '墙',
    //     show: true,
    //     wall: {
    //         positions: Cesium.Cartesian3.fromDegreesArrayHeights([
    //             107.0, 41.0, 100000.0,
    //             97.0, 41.0, 100000.0,
    //             97.0, 38.0, 100000.0,
    //             107.0, 38.0, 100000.0,
    //             107.0, 41.0, 100000.0
    //         ]),
    //         material: Cesium.Color.GREEN
    //     }      
    // }
    // viewer.entities.add(wall);

    // 定义一个几何体实例
    // let modelMatrix = Cesium.Matrix4.multiplyByUniformScale(
    //     Cesium.Matrix4.multiplyByTranslation(
    //         Cesium.Transforms.eastNorthUpToFixedFrame(
    //             Cesium.Cartesian3.fromDegrees(100.0, 35.0)
    //         ),
    //         new Cesium.Cartesian3(0.0, 0.0, 60000.0),
    //         new Cesium.Matrix4()
    //     ),
    //     1.0,
    //     new Cesium.Matrix4()
    // )
    // let boxInstance = new Cesium.GeometryInstance({
    //     geometry: Cesium.BoxGeometry.fromDimensions({
    //         dimensions: new Cesium.Cartesian3(80000.0, 60000.0, 60000.0),
    //     }),
    //     modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
    //         Cesium.Cartesian3.fromDegrees(100.0, 35.0, 60000)
    //     )
    // });
    // const shaderSource = `
    //     uniform vec4 color;

    //     czm_material czm_getMaterial(czm_materialInput materialInput)
    //     {
    //         vec4 outColor = color;
    //         czm_material material = czm_getDefaultMaterial(materialInput);
    //         vec2 st = materialInput.st;
    //         outColor.a = st.s;
    //         material.diffuse = czm_gammaCorrect(outColor.rgb);
    //         // material.emission = outColor.rgb + vec3(0.5);
    //         material.alpha = outColor.a;
    //         return material;
    //     }
    // `
    // const myMaterial = new Cesium.Material({
    //     translucent: false,
    //     fabric: {
    //         type: 'test',
    //         uniforms: {
    //             color: new Cesium.Color(1, 0, 0, 1),
    //         },
    //         source: shaderSource
    //     }
    // })
    // let boxPrimitive = new Cesium.Primitive({
    //     geometryInstances: boxInstance,
    //     appearance: new Cesium.MaterialAppearance({
    //         material: myMaterial,
    //     }),
    // })
    // viewer.scene.primitives.add(boxPrimitive);



    // //primitive添加矩形
    // let rectangleInstance = new Cesium.GeometryInstance({
    //     geometry: new Cesium.RectangleGeometry({
    //         rectangle: Cesium.Rectangle.fromDegrees(108.0, 40.0, 108.5, 40.5)
    //     })
    // })
    // let rectangleAppearance = new Cesium.EllipsoidSurfaceAppearance({
    //     material: Cesium.Material.fromType('Water')
    // })
    // viewer.scene.primitives.add(new Cesium.Primitive({
    //     geometryInstances: rectangleInstance,
    //     appearance: rectangleAppearance
    // }))
}
// 加载 GeoJSON 数据
const loadGeoJson = async () => {
    geoJsonDataSource = await Cesium.GeoJsonDataSource.load('/data/geojson/china.geojson', {
        stroke: Cesium.Color.WHITE, // 边框颜色
        fill: defaultFillColor, // 默认填充颜色
        strokeWidth: 10,
        // clampToGround: true,
    });
    viewer.value.dataSources.add(geoJsonDataSource);

    // 设置鼠标事件
    setupMouseEvents();
};

// 设置鼠标事件
const setupMouseEvents = () => {
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    // 鼠标移动事件
    handler.setInputAction((movement: any) => {
        const pickedObject = scene.pick(movement.position);

        // 如果拾取到的是 GeoJSON 中的实体
        if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
            const entity = pickedObject.id;

            // 如果当前高亮的不是同一个省份
            if (highlightedFeature.feature !== entity) {
                // 恢复之前的高亮省份样式
                if (highlightedFeature.feature) {
                    resetHighlight(highlightedFeature.feature);
                }

                // 高亮当前省份
                highlightedFeature.feature = entity;
                highlightFeature(entity);
            }
        } else {
            // 如果没有拾取到任何实体，恢复高亮省份的样式
            if (highlightedFeature.feature) {
                resetHighlight(highlightedFeature.feature);
                highlightedFeature.feature = null;
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction((movement: any) => {
        const cartesian = scene.pickPosition(movement.endPosition);
        if (cartesian) {
            const cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
            const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
            const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
            mapStore.updateMousePosition(longitude, latitude); // 更新鼠标位置
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 相机参数监听
    camera.changed.addEventListener(() => {
        const cartographic = Cesium.Cartographic.fromCartesian(camera.position);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
        const height = cartographic.height.toFixed(2);
        const heading = Cesium.Math.toDegrees(camera.heading).toFixed(2);
        const pitch = Cesium.Math.toDegrees(camera.pitch).toFixed(2);
        const roll = Cesium.Math.toDegrees(camera.roll).toFixed(2);

        mapStore.updateCameraParams(longitude, latitude, height, heading, pitch, roll); // 更新相机参数
    });
};

// 高亮省份
const highlightFeature = (entity: Cesium.Entity) => {
    if (entity.polygon) {
        entity.polygon.material = new Cesium.ColorMaterialProperty(selectedColor); // 设置高亮颜色
    }
};

// 恢复省份的默认样式
const resetHighlight = (entity: Cesium.Entity) => {
    if (entity.polygon) {
        entity.polygon.material = new Cesium.ColorMaterialProperty(defaultFillColor); // 恢复默认颜色
    }
};
onMounted(() => {
    initCesium();
})

</script>

<template>
    <div id="cesiumContainer"></div>
</template>

<style scoped lang="scss">
#cesiumContainer {
    width: 100%;
    height: 100%;
}
</style>
