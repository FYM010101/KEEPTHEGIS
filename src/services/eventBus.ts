import Cesium from 'cesium';
import mitt from 'mitt';

export type CesiumEvents = {
  'cesium:left-click': Cesium.Entity | null;
  'cesium:right-click': Cesium.Entity | null;
  'cesium:mouse-move': Cesium.Entity | null;
};

export const eventBus = mitt<CesiumEvents>();

export function useEventBus() {
  return {
    on: eventBus.on,
    off: eventBus.off,
    emit: eventBus.emit
  };
}