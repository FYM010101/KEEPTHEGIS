<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';
//@ts-ignore
import useMapStore from '@/store/modules/mapStore';

const mapStore = useMapStore();

let viewer: Cesium.Viewer;
let camera: Cesium.Camera;
let geoJsonDataSource: Cesium.GeoJsonDataSource;
const highlightedFeature = { feature: null as Cesium.Entity | null };

let defaultFillColor = new Cesium.Color(0, 0.4, 0.5, 0.6);
let selectedColor = new Cesium.Color(1, 1, 0, 0.5);
function initCesium() {
    viewer = new Cesium.Viewer('cesiumContainer', {
        timeline: false, // 不显示时间线
        animation: false, // 不显示动画控制
        geocoder: false, // 不显示搜索按钮编码器
        homeButton: false, // 显示初视角按钮
        sceneModePicker: false, // 显示投影方式选择器
        baseLayerPicker: false, // 显示基础图层选择器
        navigationHelpButton: false, // 不显示帮助按钮
        fullscreenButton: false, // 显示全屏按钮
        infoBox: false, // 信息框
        selectionIndicator: false   // 绿色的定位框
        // terrain: Cesium.Terrain.fromWorldTerrain(),
    });
    camera = viewer.camera;
    // viewer.scene.globe.depthTestAgainstTerrain = true;
    
    if (!mapStore.viewer) {
        mapStore.initializeViewer(viewer);
    }
    mapStore.setView(mapStore.locations['/home']);

    const tdtImageLayer = new Cesium.WebMapTileServiceImageryProvider({
        url: 'http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=22405d420b3bd1d7c7fdde8fb168c4c7',
        subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
        layer: 'tdtImgLayer',
        style: 'default',
        format: 'image/jpeg',
        tileMatrixSetID: 'GoogleMapsCompatible',
        maximumLevel: 19,
    });
    viewer.imageryLayers.addImageryProvider(tdtImageLayer);

    //添加数据
    //中国geojson数据
    loadGeoJson();
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

    //primitive添加墙，着色器实现电子围栏效果
    let wallInstance = new Cesium.GeometryInstance({
        geometry: new Cesium.WallGeometry({
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                107.0, 41.0, 100000.0,
                97.0, 41.0, 100000.0,
                97.0, 38.0, 100000.0,
                107.0, 38.0, 100000.0,
                107.0, 41.0, 100000.0
            ])
        })
    });
    const wallShaderSource = `
        float pointy (float f) {
            return 0.01 / (abs(f) + 0.02);
        }
        czm_material czm_getMaterial(czm_materialInput materialInput)
        {
            czm_material material = czm_getDefaultMaterial(materialInput);
            vec2 str = materialInput.st * 1.0;
            float iTime = czm_frameNumber / 100.0;

            vec2 uv = str;
            uv.y = fract(uv.y * repeatNum);
            vec3 col001 = vec3(0.0);
            float f001 = fract(abs(uv.y - (iTime * 0.5 * rate)));
            col001 = vec3(pointy(f001));

            vec3 col= color.rgb;//颜色2
            material.diffuse = col * pow((1.0 - str.y), 4.0) + col001;
            material.emission = col + col001;
            material.alpha = (1.0 - str.y);
            return material;
        }
    `
    const wallMaterial = new Cesium.Material({
        translucent: true,
        fabric: {
            type: 'custom',
            uniforms: {
                color: new Cesium.Color(0.23, 0.67, 0.9, 1.0),
                rate: 1,
                repeatNum: 5
            },
            source: wallShaderSource
        }
    })
    let wallPrimitive = new Cesium.Primitive({
        geometryInstances: wallInstance,
        appearance: new Cesium.MaterialAppearance({
            material: wallMaterial,
        }),
    })
    viewer.scene.primitives.add(wallPrimitive);

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
    viewer.dataSources.add(geoJsonDataSource);

    // 设置鼠标事件
    setupMouseEvents();
};

// 设置鼠标事件
const setupMouseEvents = () => {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    // 鼠标移动事件
    handler.setInputAction((movement:any) => {
        const pickedObject = viewer.scene.pick(movement.position);

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
        const cartesian = viewer.scene.pickPosition(movement.endPosition);
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
