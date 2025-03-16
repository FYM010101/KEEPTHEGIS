import * as Cesium from 'cesium';

export class CoordinateTransformer {
  // 笛卡尔坐标转WGS84
  static cartesian3ToWGS84(cartesian: Cesium.Cartesian3): {
    longitude: number;
    latitude: number;
    height: number;
  } | null {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    if (!cartographic) return null;
    
    return {
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      height: cartographic.height
    };
  }

  // WGS84转笛卡尔坐标
  static WGS84ToCartesian3(coords: {
    longitude: number;
    latitude: number;
    height?: number;
  }): Cesium.Cartesian3 {
    return Cesium.Cartesian3.fromDegrees(
      coords.longitude,
      coords.latitude,
      coords.height || 0
    );
  }

  // 屏幕坐标转场景坐标（带地形检测）
  static screenToWorldCoordinates(
    viewer: Cesium.Viewer,
    screenPosition: Cesium.Cartesian2
  ): Cesium.Cartesian3 | null {
    const scene = viewer.scene;
    const position = scene.pickPosition(screenPosition);
    return position || scene.globe.pick(
      scene.camera.getPickRay(screenPosition)!,
      scene
    );
  }

  // 度分秒转十进制
  static DMSStringToDecimal(dms: string): number {
    const parts = dms.match(/(\d+)°(\d+)′([\d.]+)″([NESW])/i);
    if (!parts) return 0;

    const degrees = parseFloat(parts[1]);
    const minutes = parseFloat(parts[2]);
    const seconds = parseFloat(parts[3]);
    const direction = parts[4].toUpperCase();

    const decimal = degrees + minutes / 60 + seconds / 3600;
    return (direction === 'S' || direction === 'W') ? -decimal : decimal;
  }

  // 坐标格式转换（支持多种格式互转）
  static convert(
    input: Cesium.Cartesian3 | Cesium.Cartographic | string | number[],
    outputType: 'Cartesian3' | 'Cartographic' | 'WGS84' | 'DMS'
  ): any {
    try {
      // 中间转换对象
      let intermediate: {
        longitude: number;
        latitude: number;
        height?: number;
      } | null = null;

      // 解析输入
      if (input instanceof Cesium.Cartesian3) {
        intermediate = this.cartesian3ToWGS84(input);
      } else if (input instanceof Cesium.Cartographic) {
        intermediate = {
          longitude: Cesium.Math.toDegrees(input.longitude),
          latitude: Cesium.Math.toDegrees(input.latitude),
          height: input.height
        };
      } else if (typeof input === 'string') {
        // 自动识别度分秒或十进制格式
        if (/[°′″]/.test(input)) {
          const decimal = this.DMSStringToDecimal(input);
          const isLat = /[NS]/i.test(input);
          intermediate = {
            longitude: isLat ? 0 : decimal,
            latitude: isLat ? decimal : 0,
          };
        } else {
          const [lon, lat] = input.split(',').map(Number);
          intermediate = { longitude: lon, latitude: lat };
        }
      } else if (Array.isArray(input)) {
        if (input.length === 2) {
          intermediate = { longitude: input[0], latitude: input[1] };
        } else if (input.length === 3) {
          intermediate = { longitude: input[0], latitude: input[1], height: input[2] };
        }
      }

      if (!intermediate) return null;

      // 转换为目标格式
      switch(outputType) {
        case 'Cartesian3':
          return this.WGS84ToCartesian3(intermediate);
        case 'Cartographic':
          return Cesium.Cartographic.fromDegrees(
            intermediate.longitude,
            intermediate.latitude,
            intermediate.height || 0
          );
        case 'WGS84':
          return intermediate;
        case 'DMS': {
          const lonDir = intermediate.longitude >= 0 ? 'E' : 'W';
          const latDir = intermediate.latitude >= 0 ? 'N' : 'S';
          return {
            longitude: `${Math.abs(intermediate.longitude).toFixed(0)}°00′00.0″${lonDir}`,
            latitude: `${Math.abs(intermediate.latitude).toFixed(0)}°00′00.0″${latDir}`
          };
        }
        default:
          throw new Error('Unsupported output type');
      }
    } catch (error) {
      console.error('Coordinate conversion failed:', error);
      return null;
    }
  }

  // 坐标系转换（WGS84/WEB墨卡托/CGCS2000）
  static transformBetweenCRS(
    coord: number[],
    fromCRS: 'WGS84' | 'WebMercator' | 'CGCS2000',
    toCRS: 'WGS84' | 'WebMercator' | 'CGCS2000'
  ): number[] {
    // 输入参数校验
    if (!Array.isArray(coord) || coord.length < 2) {
      throw new Error('Invalid coordinate format: Expected number array with at least 2 elements');
    }
    const validCRS = ['WGS84', 'WebMercator', 'CGCS2000'];
    if (!validCRS.includes(fromCRS) || !validCRS.includes(toCRS)) {
      throw new Error('Invalid CRS type: Supported types are WGS84, WebMercator, CGCS2000');
    }

    // 相同坐标系直接返回
    if (fromCRS === toCRS) return [...coord];

    // 坐标系转换路由
    const conversionKey = `${fromCRS}_${toCRS}`;
    switch (conversionKey) {
      case 'WGS84_WebMercator':
        return this.wgs84ToWebMercator(coord);
      case 'WebMercator_WGS84':
        return this.webMercatorToWgs84(coord);
      case 'WGS84_CGCS2000':
        return this.convertBetweenEllipsoids(coord, Cesium.Ellipsoid.WGS84, this.cgcs2000Ellipsoid);
      case 'CGCS2000_WGS84':
        return this.convertBetweenEllipsoids(coord, this.cgcs2000Ellipsoid, Cesium.Ellipsoid.WGS84);
      case 'WebMercator_CGCS2000':
        const wgs84 = this.webMercatorToWgs84(coord);
        return this.convertBetweenEllipsoids(wgs84, Cesium.Ellipsoid.WGS84, this.cgcs2000Ellipsoid);
      case 'CGCS2000_WebMercator':
        const wgs84FromCGCS = this.convertBetweenEllipsoids(coord, this.cgcs2000Ellipsoid, Cesium.Ellipsoid.WGS84);
        return this.wgs84ToWebMercator(wgs84FromCGCS);
      default:
        throw new Error(`Unsupported coordinate conversion: ${fromCRS} to ${toCRS}`);
    }
  }

  private static cgcs2000Ellipsoid = new Cesium.Ellipsoid(6378137.0, 6378137.0, 6356752.31414);

  // 墨卡托投影正解
  private static wgs84ToWebMercator(coord: number[]): number[] {
    const [lon, lat, height = 0] = coord;
    const projection = new Cesium.WebMercatorProjection(Cesium.Ellipsoid.WGS84);
    // const cartesian = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    // const cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
    // if (!cartographic) {
    //   throw new Error('Invalid Cartesian coordinates for WGS84 ellipsoid');
    // }
    const cartographic = this.convert([lon, lat, height], 'Cartographic');
    const projected = projection.project(cartographic);
    return [projected.x, projected.y, projected.z];
  }

  // 墨卡托投影反解
  private static webMercatorToWgs84(coord: number[]): number[] {
    const [x, y, z = 0] = coord;
    const projection = new Cesium.WebMercatorProjection(Cesium.Ellipsoid.WGS84);
    const cartesian = new Cesium.Cartesian3(x, y, z);
    const unprojected = projection.unproject(cartesian);
    // const cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(unprojected);
    return [
      Cesium.Math.toDegrees(unprojected.longitude),
      Cesium.Math.toDegrees(unprojected.latitude),
      unprojected.height
    ];
  }

  // 椭球体转换（使用七参数法）
  private static convertBetweenEllipsoids(
    coord: number[],
    sourceEllipsoid: Cesium.Ellipsoid,
    targetEllipsoid: Cesium.Ellipsoid
  ): number[] {
    const [lon, lat, height = 0] = coord;
    const cartesian = sourceEllipsoid.cartographicToCartesian(
      Cesium.Cartographic.fromDegrees(lon, lat, height)
    );
    
    // 应用七参数转换（示例值，需根据实际参数调整）
    const dx = 1.004; // X轴平移
    const dy = -0.927; // Y轴平移
    const dz = 1.423; // Z轴平移
    const rx = 0.00021383; // 旋转X
    const ry = 0.00000753; // 旋转Y
    const rz = 0.00001024; // 旋转Z
    const scale = 1.00000005; // 比例因子

    const transformed = new Cesium.Cartesian3(
      cartesian.x * scale + ry * cartesian.z - rz * cartesian.y + dx,
      cartesian.y * scale + rz * cartesian.x - rx * cartesian.z + dy,
      cartesian.z * scale + rx * cartesian.y - ry * cartesian.x + dz
    );

    const targetCartographic = targetEllipsoid.cartesianToCartographic(transformed);
    return [
      Cesium.Math.toDegrees(targetCartographic.longitude),
      Cesium.Math.toDegrees(targetCartographic.latitude),
      targetCartographic.height
    ];
  }
}