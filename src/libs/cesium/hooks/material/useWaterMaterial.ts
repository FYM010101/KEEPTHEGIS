import * as Cesium from 'cesium';

export interface WaterMaterialOptions {
  baseColor?: Cesium.Color;
  rippleColor?: Cesium.Color;
  speed?: number;
  reflectivity?: number;
  frequency?: number;
  amplitude?: number;
  waveDirection?: Cesium.Cartesian2;
}

export function useWaterMaterial(options: WaterMaterialOptions = {}) {
  const {
    baseColor = new Cesium.Color(0.1, 0.3, 0.8, 0.8),
    rippleColor = new Cesium.Color(0.8, 0.9, 1.0, 0.5),
    speed = 1.0,
    reflectivity = 0.8,
    frequency = 100.0,
    amplitude = 0.05,
    waveDirection = new Cesium.Cartesian2(1.0, 1.0)
  } = options;

  return new Cesium.Material({
    fabric: {
      type: 'Water',
      uniforms: {
        baseColor: baseColor,
        rippleColor: rippleColor,
        speed: speed,
        reflectivity: reflectivity,
        frequency: frequency,
        amplitude: amplitude,
        waveDirection: waveDirection,
        normalMap: './textures/waterNormals.jpg'
      },
      source: `
        czm_material czm_getMaterial(czm_materialInput materialInput) {
          czm_material material = czm_getDefaultMaterial(materialInput);
          
          // 计算时间因子
          float time = czm_frameNumber * speed * 0.01;
          
          // 波浪UV动画
          vec2 waveOffset = waveDirection * time;
          vec2 uv = materialInput.st * frequency;
          
          // 使用两层噪声采样创建更复杂的波浪效果
          vec4 noise1 = texture(normalMap, uv * 0.8 + waveOffset);
          vec4 noise2 = texture(normalMap, uv * 1.2 - waveOffset * 0.8);
          
          // 混合两层噪声
          vec3 normalVector = mix(noise1.rgb, noise2.rgb, 0.5) * 2.0 - 1.0;
          
          // 波浪高度变化
          float waveHeight = sin(uv.x * 6.0 + time) * cos(uv.y * 4.0 - time * 0.8) * amplitude;
          waveHeight += sin(uv.x * 2.5 - time * 1.2) * cos(uv.y * 3.0 + time) * amplitude * 1.5;
          
          // 计算水面颜色
          float fresnel = pow(1.0 - max(0.0, dot(normalVector, vec3(0.0, 0.0, 1.0))), 2.0);
          vec3 waterColor = mix(baseColor.rgb, rippleColor.rgb, fresnel * 0.5 + waveHeight);
          
          // 应用法线扰动
          material.normal = normalize(vec3(normalVector.xy * 0.5, 1.0));
          
          // 设置材质属性
          material.diffuse = waterColor;
          material.specular = reflectivity + fresnel * 0.3;
          material.shininess = 80.0 + fresnel * 40.0;
          material.alpha = baseColor.a * (0.8 + fresnel * 0.2);
          
          return material;
        }
      `
    }
  });
}