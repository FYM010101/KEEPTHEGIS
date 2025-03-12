import { onUnmounted } from 'vue';
import * as Cesium from 'cesium';
import type { CircleScanOptions, CircleScanSystem } from '@/libs/cesium/types';
import useMapStore from '@/store/modules/mapStore';


export function useCircleScan(options: CircleScanOptions): CircleScanSystem {
    const mapStore = useMapStore();
    class CircleScanSystemImpl implements CircleScanSystem {
        private primitives: Cesium.PostProcessStage | null = null;
        private data: Required<CircleScanOptions>;

        constructor(options: CircleScanOptions) {
            const defaults = {
                radius: 1000,
                scanColor: new Cesium.Color(1.0, 0.0, 0.0, 1),
                interval: 3000
            };

            this.data = { ...defaults, ...options } as Required<CircleScanOptions>;

            if (options.type === 'Circle') {
                this.primitives = this.addCircleScan();
            } else {
                this.primitives = this.addRadarScan();
            }
        }

        // 核心实现方法（保持原JS逻辑，添加类型标注）
        private addCircleScan(): Cesium.PostProcessStage {
            // 原 AddCircleScanPostStage 实现...
            const _this = this;
            // if (!mapStore.hasViewer()) {
            //     console.error('Viewer 未初始化');
            // }
            // mapStore.viewer!.scene.globe.depthTestAgainstTerrain = true; //防止移动、放大缩小会视觉偏移depthTestAgainstTerrain // 设置该属性为true之后，标绘将位于地形的顶部；如果设为false（默认值），那么标绘将位于平面上。缺陷：开启该属性有可能在切换图层时会引发标绘消失的bug。
            var CartographicCenter = new Cesium.Cartographic(Cesium.Math.toRadians(this.data.lon), Cesium.Math.toRadians(this.data.lat), 0); //中心位子
            var ScanSegmentShader =
                "uniform sampler2D colorTexture;\n" +
                "uniform sampler2D depthTexture;\n" +
                "in vec2 v_textureCoordinates;\n" +
                "uniform vec4 u_scanCenterEC;\n" +
                "uniform vec3 u_scanPlaneNormalEC;\n" +
                "uniform float u_radius;\n" +
                "uniform vec4 u_scanColor;\n" +
                "out vec4 fragColor;\n" +
                "vec4 toEye(in vec2 uv, in float depth)\n" +
                " {\n" +
                " vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));\n" +
                " vec4 posInCamera =czm_inverseProjection * vec4(xy, depth, 1.0);\n" +
                " posInCamera =posInCamera / posInCamera.w;\n" +
                " return posInCamera;\n" +
                " }\n" +
                "vec3 pointProjectOnPlane(in vec3 planeNormal, in vec3 planeOrigin, in vec3 point)\n" +
                "{\n" +
                "vec3 v01 = point -planeOrigin;\n" +
                "float d = dot(planeNormal, v01) ;\n" +
                "return (point - planeNormal * d);\n" +
                "}\n" +
                "float getDepth(in vec4 depth)\n" +
                "{\n" +
                "float z_window = czm_unpackDepth(depth);\n" +
                "z_window = czm_reverseLogDepth(z_window);\n" +
                "float n_range = czm_depthRange.near;\n" +
                "float f_range = czm_depthRange.far;\n" +
                "return (2.0 * z_window - n_range - f_range) / (f_range - n_range);\n" +
                "}\n" +
                "void main()\n" +
                "{\n" +
                "fragColor = texture(colorTexture, v_textureCoordinates);\n" +
                "float depth = getDepth( texture(depthTexture, v_textureCoordinates));\n" +
                "vec4 viewPos = toEye(v_textureCoordinates, depth);\n" +
                "vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz, u_scanCenterEC.xyz, viewPos.xyz);\n" +
                "float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);\n" +
                "if(dis < u_radius)\n" +
                "{\n" +
                "float f = 1.0 -abs(u_radius - dis) / u_radius;\n" +
                "f = pow(f, 4.0);\n" +
                "fragColor = mix(fragColor, u_scanColor, f);\n" +
                "}\n" +
                "}\n";

            var _Cartesian3Center = Cesium.Cartographic.toCartesian(CartographicCenter);
            var _Cartesian4Center = new Cesium.Cartesian4(_Cartesian3Center.x, _Cartesian3Center.y, _Cartesian3Center.z, 1);
            var _CartographicCenter1 = new Cesium.Cartographic(CartographicCenter.longitude, CartographicCenter.latitude, CartographicCenter.height + 500);
            var _Cartesian3Center1 = Cesium.Cartographic.toCartesian(_CartographicCenter1);
            var _Cartesian4Center1 = new Cesium.Cartesian4(_Cartesian3Center1.x, _Cartesian3Center1.y, _Cartesian3Center1.z, 1);
            var _time = (new Date()).getTime();
            var _scratchCartesian4Center = new Cesium.Cartesian4();
            var _scratchCartesian4Center1 = new Cesium.Cartesian4();
            var _scratchCartesian3Normal = new Cesium.Cartesian3();
            var ScanPostStage = new Cesium.PostProcessStage({
                fragmentShader: ScanSegmentShader,
                uniforms: {
                    u_scanCenterEC: function () {
                        return Cesium.Matrix4.multiplyByVector(mapStore.viewer!.camera.viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
                    },
                    u_scanPlaneNormalEC: function () {
                        var temp = Cesium.Matrix4.multiplyByVector(mapStore.viewer!.camera.viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
                        var temp1 = Cesium.Matrix4.multiplyByVector(mapStore.viewer!.camera.viewMatrix, _Cartesian4Center1, _scratchCartesian4Center1);
                        _scratchCartesian3Normal.x = temp1.x - temp.x;
                        _scratchCartesian3Normal.y = temp1.y - temp.y;
                        _scratchCartesian3Normal.z = temp1.z - temp.z;
                        Cesium.Cartesian3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal);
                        return _scratchCartesian3Normal;

                    },
                    u_radius: function () {
                        return _this.data.radius * (((new Date()).getTime() - _time) % _this.data.interval) / _this.data.interval;
                    },
                    u_scanColor: _this.data.scanColor
                }
            });
            mapStore.viewer!.scene.postProcessStages.add(ScanPostStage);
            return (ScanPostStage);
        }

        private addRadarScan(): Cesium.PostProcessStage {
            // 原 AddRadarScanPostStage 实现...
            const _this = this;
            // mapStore.viewer!.scene.globe.depthTestAgainstTerrain = true; //防止移动、放大缩小会视觉偏移depthTestAgainstTerrain // 设置该属性为true之后，标绘将位于地形的顶部；如果设为false（默认值），那么标绘将位于平面上。缺陷：开启该属性有可能在切换图层时会引发标绘消失的bug。
            var CartographicCenter = new Cesium.Cartographic(Cesium.Math.toRadians(this.data.lon), Cesium.Math.toRadians(this.data.lat), 0); //中心位子
            var ScanSegmentShader =
                "uniform sampler2D colorTexture;\n" +
                "uniform sampler2D depthTexture;\n" +
                "in vec2 v_textureCoordinates;\n" +
                "uniform vec4 u_scanCenterEC;\n" +
                "uniform vec3 u_scanPlaneNormalEC;\n" +
                "uniform vec3 u_scanLineNormalEC;\n" +
                "uniform float u_radius;\n" +
                "uniform vec4 u_scanColor;\n" +
                "out vec4 fragColor;\n" +
                "vec4 toEye(in vec2 uv, in float depth)\n" +
                " {\n" +
                " vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));\n" +
                " vec4 posInCamera =czm_inverseProjection * vec4(xy, depth, 1.0);\n" +
                " posInCamera =posInCamera / posInCamera.w;\n" +
                " return posInCamera;\n" +
                " }\n" +
                "bool isPointOnLineRight(in vec3 ptOnLine, in vec3 lineNormal, in vec3 testPt)\n" +
                "{\n" +
                "vec3 v01 = testPt - ptOnLine;\n" +
                "normalize(v01);\n" +
                "vec3 temp = cross(v01, lineNormal);\n" +
                "float d = dot(temp, u_scanPlaneNormalEC);\n" +
                "return d > 0.5;\n" +
                "}\n" +
                "vec3 pointProjectOnPlane(in vec3 planeNormal, in vec3 planeOrigin, in vec3 point)\n" +
                "{\n" +
                "vec3 v01 = point -planeOrigin;\n" +
                "float d = dot(planeNormal, v01) ;\n" +
                "return (point - planeNormal * d);\n" +
                "}\n" +
                "float distancePointToLine(in vec3 ptOnLine, in vec3 lineNormal, in vec3 testPt)\n" +
                "{\n" +
                "vec3 tempPt = pointProjectOnPlane(lineNormal, ptOnLine, testPt);\n" +
                "return length(tempPt - ptOnLine);\n" +
                "}\n" +
                "float getDepth(in vec4 depth)\n" +
                "{\n" +
                "float z_window = czm_unpackDepth(depth);\n" +
                "z_window = czm_reverseLogDepth(z_window);\n" +
                "float n_range = czm_depthRange.near;\n" +
                "float f_range = czm_depthRange.far;\n" +
                "return (2.0 * z_window - n_range - f_range) / (f_range - n_range);\n" +
                "}\n" +
                "void main()\n" +
                "{\n" +
                "fragColor = texture(colorTexture, v_textureCoordinates);\n" +
                "float depth = getDepth( texture(depthTexture, v_textureCoordinates));\n" +
                "vec4 viewPos = toEye(v_textureCoordinates, depth);\n" +
                "vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz, u_scanCenterEC.xyz, viewPos.xyz);\n" +
                "float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);\n" +
                "float twou_radius = u_radius * 2.0;\n" +
                "if(dis < u_radius)\n" +
                "{\n" +
                "float f0 = 1.0 -abs(u_radius - dis) / u_radius;\n" +
                "f0 = pow(f0, 64.0);\n" +
                "vec3 lineEndPt = vec3(u_scanCenterEC.xyz) + u_scanLineNormalEC * u_radius;\n" +
                "float f = 0.0;\n" +
                "if(isPointOnLineRight(u_scanCenterEC.xyz, u_scanLineNormalEC.xyz, prjOnPlane.xyz))\n" +
                "{\n" +
                "float dis1= length(prjOnPlane.xyz - lineEndPt);\n" +
                "f = abs(twou_radius -dis1) / twou_radius;\n" +
                "f = pow(f, 3.0);\n" +
                "}\n" +
                "fragColor = mix(fragColor, u_scanColor, f + f0);\n" +
                "}\n" +
                "}\n";

            var _Cartesian3Center = Cesium.Cartographic.toCartesian(CartographicCenter);
            var _Cartesian4Center = new Cesium.Cartesian4(_Cartesian3Center.x, _Cartesian3Center.y, _Cartesian3Center.z, 1);
            var _CartographicCenter1 = new Cesium.Cartographic(CartographicCenter.longitude, CartographicCenter.latitude, CartographicCenter.height + 500);
            var _Cartesian3Center1 = Cesium.Cartographic.toCartesian(_CartographicCenter1);
            var _Cartesian4Center1 = new Cesium.Cartesian4(_Cartesian3Center1.x, _Cartesian3Center1.y, _Cartesian3Center1.z, 1);
            var _CartographicCenter2 = new Cesium.Cartographic(CartographicCenter.longitude + Cesium.Math.toRadians(0.001), CartographicCenter.latitude, CartographicCenter.height);
            var _Cartesian3Center2 = Cesium.Cartographic.toCartesian(_CartographicCenter2);
            var _Cartesian4Center2 = new Cesium.Cartesian4(_Cartesian3Center2.x, _Cartesian3Center2.y, _Cartesian3Center2.z, 1);
            var _RotateQ = new Cesium.Quaternion();
            var _RotateM = new Cesium.Matrix3();
            var _time = (new Date()).getTime();
            var _scratchCartesian4Center = new Cesium.Cartesian4();
            var _scratchCartesian4Center1 = new Cesium.Cartesian4();
            var _scratchCartesian4Center2 = new Cesium.Cartesian4();
            var _scratchCartesian3Normal = new Cesium.Cartesian3();
            var _scratchCartesian3Normal1 = new Cesium.Cartesian3();
            var ScanPostStage = new Cesium.PostProcessStage({
                fragmentShader: ScanSegmentShader,
                uniforms: {
                    u_scanCenterEC: function () {
                        return Cesium.Matrix4.multiplyByVector(mapStore.viewer!.camera.viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
                    },
                    u_scanPlaneNormalEC: function () {
                        var temp = Cesium.Matrix4.multiplyByVector(mapStore.viewer!.camera.viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
                        var temp1 = Cesium.Matrix4.multiplyByVector(mapStore.viewer!.camera.viewMatrix, _Cartesian4Center1, _scratchCartesian4Center1);
                        _scratchCartesian3Normal.x = temp1.x - temp.x;
                        _scratchCartesian3Normal.y = temp1.y - temp.y;
                        _scratchCartesian3Normal.z = temp1.z - temp.z;
                        Cesium.Cartesian3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal);
                        return _scratchCartesian3Normal;

                    },
                    u_radius: function () {
                        return _this.data.radius * 1;
                    },
                    u_scanLineNormalEC: function () {
                        var temp = Cesium.Matrix4.multiplyByVector(mapStore.viewer!.camera.viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
                        var temp1 = Cesium.Matrix4.multiplyByVector(mapStore.viewer!.camera.viewMatrix, _Cartesian4Center1, _scratchCartesian4Center1);
                        var temp2 = Cesium.Matrix4.multiplyByVector(mapStore.viewer!.camera.viewMatrix, _Cartesian4Center2, _scratchCartesian4Center2);
                        _scratchCartesian3Normal.x = temp1.x - temp.x;
                        _scratchCartesian3Normal.y = temp1.y - temp.y;
                        _scratchCartesian3Normal.z = temp1.z - temp.z;
                        Cesium.Cartesian3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal);
                        _scratchCartesian3Normal1.x = temp2.x - temp.x;
                        _scratchCartesian3Normal1.y = temp2.y - temp.y;
                        _scratchCartesian3Normal1.z = temp2.z - temp.z;
                        var tempTime = (((new Date()).getTime() - _time) % _this.data.interval) / _this.data.interval;
                        Cesium.Quaternion.fromAxisAngle(_scratchCartesian3Normal, tempTime * Cesium.Math.PI * 2, _RotateQ);
                        Cesium.Matrix3.fromQuaternion(_RotateQ, _RotateM);
                        Cesium.Matrix3.multiplyByVector(_RotateM, _scratchCartesian3Normal1, _scratchCartesian3Normal1);
                        Cesium.Cartesian3.normalize(_scratchCartesian3Normal1, _scratchCartesian3Normal1);
                        return _scratchCartesian3Normal1;
                    },
                    u_scanColor: _this.data.scanColor
                }
            });
            mapStore.viewer!.scene.postProcessStages.add(ScanPostStage);
            return (ScanPostStage);
        }

        public remove(): void {
            if (this.primitives) {
                mapStore.viewer!.scene.postProcessStages.remove(this.primitives);
                this.primitives = null;
            }
        }
    }

    // 创建实例
    const instance = new CircleScanSystemImpl(options);

    // 自动销毁
    onUnmounted(() => instance.remove());

    return instance;
}