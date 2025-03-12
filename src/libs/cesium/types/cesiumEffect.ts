import type { Color } from 'cesium';

export type ScanType = 'Circle' | 'Radar';

export interface CircleScanOptions {
    type: ScanType;
    lon: number;
    lat: number;
    radius?: number;
    scanColor?: Color;
    interval?: number;
}

export interface CircleScanSystem {
    remove: () => void;
}