import * as Cesium from 'cesium';
import { BaseMaterialOptions, WallMaterialOptions, StreamerLineMaterialOptions } from '../types/material';

export class MaterialManager {
    private static _instance: MaterialManager;
    private _materialCache = new Map<string, Cesium.Material>();

    static get instance() {
        if (!this._instance) {
            this._instance = new MaterialManager();
        }
        return this._instance;
    }

    createMaterial(options: BaseMaterialOptions) {
        const cacheKey = this.generateCacheKey(options);

        // 优先返回缓存材质
        if (this._materialCache.has(cacheKey)) {
            return this._materialCache.get(cacheKey)!;
        }

        // 根据类型创建材质
        let material: Cesium.Material;
        switch (options.type) {
            case 'wall':
                material = this.createWallMaterial(options as WallMaterialOptions);
                break;
            case 'streamerLine':
                material = this.createStreamerLineMaterial(options as StreamerLineMaterialOptions);
                break;
            // 可扩展其他材质类型
            default:
                throw new Error(`Unsupported material type: ${options.type}`);
        }

        this._materialCache.set(cacheKey, material);
        return material;
    }

    private createWallMaterial(options: WallMaterialOptions): Cesium.Material {
        const { color, rate, repeatNum } = {
            color: new Cesium.Color(0.23, 0.67, 0.9, 1.0), // 默认颜色
            rate: 1, // 默认速率
            repeatNum: 5, // 默认重复次数
            ...options,
        };

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
    `;

        return new Cesium.Material({
            translucent: true,
            fabric: {
                type: 'custom',
                uniforms: {
                    color,
                    rate,
                    repeatNum,
                },
                source: wallShaderSource,
            },
        });
    }
    private createStreamerLineMaterial(options: StreamerLineMaterialOptions): Cesium.Material {
        const { color, image, speed } = {
            color: Cesium.Color.fromCssColorString("#7ffeff"), // 默认颜色
            image: '/textures/line1.png',
            speed: 3, // 默认速率
            ...options,
        };
        const streamerLineShaderSource = `czm_material czm_getMaterial(czm_materialInput materialInput)
      {
          czm_material material = czm_getDefaultMaterial(materialInput);
          vec2 st = materialInput.st;
          vec4 colorImage = texture(image, vec2(fract((st.s - speed * czm_frameNumber * 0.001)), st.t));
          material.alpha = colorImage.a * color.a;
          material.diffuse = color.rgb;
          return material;
  }`;
        return new Cesium.Material({
            translucent: true,
            fabric: {
                uniforms: {
                    color,
                    image,
                    speed,
                },
                source: streamerLineShaderSource,
            }
        });
    }

    private generateCacheKey(options: BaseMaterialOptions) {
        return options.cacheKey || `${options.type}_${JSON.stringify(options)}`;
    }

    // 其他管理方法...
}