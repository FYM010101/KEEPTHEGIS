// useWallMaterial.ts
import * as Cesium from 'cesium';
import type { WallMaterialOptions } from '../../types';

export function useWallMaterial(options: WallMaterialOptions = {}): Cesium.Material {
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