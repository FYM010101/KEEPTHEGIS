import { ref, Ref } from 'vue';
import * as Cesium from 'cesium';

/**
 * Popup配置选项接口
 */
export interface PopupOptions {
    viewer: Cesium.Viewer; // 三维视图
    className?: string; // 样式名
    html?: (header: string, content: string) => string; // 自定义HTML模板
}

/**
 * Popup内容配置接口
 */
export interface PopupContentConfig {
    header: string; // 弹窗标题
    content: string; // 弹窗内容
}

/**
 * Popup添加配置接口
 */
export interface PopupAddConfig {
    geometry: Cesium.Cartesian3; // 弹窗挂载的位置
    content: PopupContentConfig; // 弹窗内容配置
    isclose?: boolean; // 是否显示关闭按钮
}

/**
 * Tooltip配置选项接口
 */
export interface TooltipOptions {
    viewer: Cesium.Viewer; // 三维视图
    color?: string; // 背景颜色
    stroke?: string; // 边框颜色
    opacity?: number; // 透明度
    textcolor?: string; // 文本颜色
    strokewidth?: number; // 边框宽度
    lineheight?: number; // 行高
    fontSize?: string; // 字体大小
    x?: number; // X轴偏移
    y?: number; // Y轴偏移
    defaultHeight?: number; // 默认高度
    width?: number; // 宽度
}

/**
 * Tooltip添加配置接口
 */
export interface TooltipAddConfig {
    position: Cesium.Cartesian3; // 提示框位置
    header: string; // 提示框标题
    content: string; // 提示框内容
    id?: string; // 提示框ID
    width?: number; // 提示框宽度
}

/**
 * @class Popup 地图弹窗
 */
export class Popup {
    private options: PopupOptions;
    private viewer: Cesium.Viewer;
    private className?: string;
    private html?: (header: string, content: string) => string;
    private id: number;
    private ctnList: Record<string, [Cesium.Cartesian3, HTMLDivElement]>;
    private eventListener: ((clock: Cesium.Clock) => void) | null;

    constructor(option: PopupOptions) {
        this.options = option;
        this.viewer = option.viewer;
        this.className = option.className;
        this.html = option.html || undefined;
        this.id = 0;
        this.ctnList = {};
        this.eventListener = null;
    }

    /**
     * 添加弹窗
     * @param conf 弹窗配置
     * @returns HTMLDivElement 弹窗DOM元素
     */
    add(conf: PopupAddConfig): HTMLDivElement {
        const _this = this;
        const geometry = conf.geometry; // 弹窗挂载的位置
        const id = "popup_" + (((1 + Math.random()) * 0x10000) | 0).toString(16) + _this.id++;
        const ctn = document.createElement('div');
        ctn.className = "bx-popup-ctn" + (this.className ? " " + this.className : " bx-popup-ctn1");
        ctn.id = id;
        const container = document.getElementById(_this.viewer.container.id);
        
        if (container) {
            container.appendChild(ctn);
        } else {
            throw new Error('容器元素未找到');
        }

        // 设置弹窗内容
        const testConfig = conf.content;
        ctn.innerHTML = _this.createHtml(testConfig.header, testConfig.content, conf.isclose);
        _this.ctnList[id] = [geometry, ctn];
        _this.render();

        if (!_this.eventListener) {
            _this.eventListener = function (clock) {
                _this.render();
            };
            _this.viewer.clock.onTick.addEventListener(_this.eventListener);
        }

        if (conf.isclose === false) {
            // 不显示关闭按钮时不添加关闭事件
        } else {
            if (ctn.getElementsByClassName("bx-popup-close") && ctn.getElementsByClassName("bx-popup-close").length > 0) {
                (ctn.getElementsByClassName("bx-popup-close")[0] as HTMLElement).onclick = function () {
                    _this.close(ctn);
                };
            }
        }
        return ctn;
    }

    /**
     * 渲染弹窗位置
     */
    render(): void {
        const _this = this;
        for (const c in _this.ctnList) {
            const position = Cesium.SceneTransforms.worldToWindowCoordinates(_this.viewer.scene, _this.ctnList[c][0]);
            if (position && position.x && position.y) {
                if (Math.abs(position.x) > (window.innerWidth * 2) || Math.abs(position.y) > (window.innerHeight * 2)) {
                    _this.ctnList[c][1].style.display = "none";
                } else {
                    _this.ctnList[c][1].style.display = "";
                    _this.ctnList[c][1].style.left = position.x + "px";
                    _this.ctnList[c][1].style.top = position.y + "px";
                }
            }
        }
    }

    /**
     * 创建HTML内容
     * @param header 标题
     * @param content 内容
     * @param isclose 是否显示关闭按钮
     * @returns string HTML字符串
     */
    createHtml(header: string, content: string, isclose?: boolean): string {
        if (this.html) {
            return this.html(header, content);
        } else {
            const html = `
      <div class="divpoint-wrap">
      <div class="divpoint-border">
      <div class="divpoint-center">
      <div class="bx-popup-header-ctn">
      ${header}
      </div>
      ${(isclose === false ? '' : '<div class="bx-popup-close"><span class="iconfont_DEU icon-guanbi">×</span></div>')}
      
      <div class="bx-popup-content-ctn" >
      <div class="bx-popup-content" >
      ${content}
      </div>
      </div>
      </div>
      </div>
      </div>
      <div class="directional"></div>
      `;
            return html;
        }
    }

    /**
     * 关闭指定弹窗
     * @param e 弹窗DOM元素
     */
    close(e: HTMLDivElement): void {
        e.remove();
        delete this.ctnList[e.id];
        if (Object.keys(this.ctnList).length == 0) {
            if (this.eventListener) {
                this.viewer.clock.onTick.removeEventListener(this.eventListener);
            }
            this.eventListener = null;
        }
    }

    /**
     * 关闭所有弹窗
     */
    closeAll(): void {
        for (const o in this.ctnList) {
            this.ctnList[o][1].remove();
        }
        this.ctnList = {};
        if (this.eventListener) {
            this.viewer.clock.onTick.removeEventListener(this.eventListener);
        }
        this.eventListener = null;
    }
}

/**
 * @class Tooltip 地图提示框
 */
export class Tooltip {
    private options: TooltipOptions;
    private tooltipEntitylist: Record<string, { id: string, entity: Cesium.Entity, clear: () => void }>;
    private viewer: Cesium.Viewer;
    private dataSource: Cesium.CustomDataSource;

    constructor(opt: TooltipOptions) {
        this.options = {
            viewer: opt.viewer,
            color: 'rgb(32, 160, 255)',
            stroke: 'rgb(56, 218, 255)',
            opacity: 0.6,
            textcolor: 'white',
            strokewidth: 3,
            lineheight: 25,
            fontSize: '14px',
            x: 15,
            y: 50,
            defaultHeight: 200,
            width: 200,
        };
        this.options = Object.assign(this.options, opt);
        this.tooltipEntitylist = {};
        this.viewer = opt.viewer;
        this.dataSource = new Cesium.CustomDataSource("tooltipname");
        this.viewer.dataSources.add(this.dataSource);
    }

    /**
     * 添加提示框
     * @param option 提示框配置
     */
    add(option: TooltipAddConfig): void {
        const this_ = this;
        const header = option.header,
            content = option.content;
        const contlist = content.split("<br/>");
        let x = this_.options.x,
            y = this_.options.y || 0,
            height = this_.options.defaultHeight;
        const width = option.width || this_.options.width || 200;
        height = contlist.length * (this_.options.lineheight || 25) + 10;
        if (header && header != '') {
            height += 27;
        }
        let cen = '';
        for (let i = 0; i < contlist.length; i++) {
            cen += '<tspan x="' + x + '" y="' + y + '">' + contlist[i] + '</tspan>';
            y += (this_.options.lineheight || 25);
        }
        const data = `data:image/svg+xml,
            <svg width="${(width) + 10}" height="${height + 30}" version="1.1" xmlns="http://www.w3.org/2000/svg">
                
<path d=" M${width + 5} 15 Q${width + 5} 5 ${width + 5 - 10} 5 L15 5 Q5 5 5 15 L5 ${height - 10 + 5} Q5 ${height + 5} 15 ${height + 5} L${width / 2 - 10 + 5} ${height + 5} ${width / 2 + 5} ${height + 20 + 5} ${width / 2 + 10 + 5} ${height + 5} ${width - 10 + 5} ${height + 5} Q${width + 5} ${height + 5} ${width + 5} ${height - 10 + 5} Z"
 fill="${this_.options.color}" stroke="${this_.options.stroke}" style="${this_.options.strokewidth}:3;opacity:${this_.options.opacity};stroke-opacity:0.8"></path>
<path d=" M${width + 5} 15 Q${width + 5} 5 ${width + 5 - 10} 5 L15 5 Q5 5 5 15 L5 30 ${width + 5} 30 Z" 
fill="${this_.options.color}" style="opacity:0.5;"></path>
<text x="15" y="22" fill="${this_.options.textcolor}" style="font-size:${this_.options.fontSize}; font-weight: 600;">${header}</text>
     <text fill="${this_.options.textcolor}" style="font-size: ${this_.options.fontSize};">
        ${cen}
  </text>

</svg>
`;
        const entity = {
            position: option.position,
            billboard: {
                image: data,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM
            },
        };
        const ety = this_.dataSource.entities.add(entity);
        const id = option.id || Cesium.createGuid();
        const tooltip = {
            id: id,
            entity: ety,
            clear: function () {
                this_.cleartooltip(id);
            }
        };
        this_.tooltipEntitylist[id] = tooltip;
    }

    /**
     * 清除提示框
     * @param id 提示框ID，不传则清除所有
     */
    cleartooltip(id?: string): void {
        const this_ = this;
        if (id) {
            this_.dataSource.entities.remove(this_.tooltipEntitylist[id].entity);
            delete this_.tooltipEntitylist[id];
        } else {
            this_.dataSource.entities.removeAll();
            this_.tooltipEntitylist = {};
        }
    }
}

/**
 * 使用Popup和Tooltip的钩子函数
 * @param viewer Cesium Viewer实例
 * @returns 返回Popup和Tooltip实例
 */
export function usePopup() {
    const popup = ref<Popup | null>(null);
    const tooltip = ref<Tooltip | null>(null);

    /**
     * 初始化Popup
     * @param options Popup配置选项
     * @returns Popup实例
     */
    const initPopup = (viewer: Cesium.Viewer | null, options: Omit<PopupOptions, 'viewer'> = {}) => {
        if (viewer) {
            popup.value = new Popup({
                viewer: viewer,
                ...options
            });
        }
        return popup.value;
    };

    /**
     * 初始化Tooltip
     * @param options Tooltip配置选项
     * @returns Tooltip实例
     */
    const initTooltip = (viewer: Cesium.Viewer | null, options: Omit<TooltipOptions, 'viewer'> = {}) => {
        if (viewer) {
            tooltip.value = new Tooltip({
                viewer: viewer,
                ...options
            });
        }
        return tooltip.value;
    };
    const clearPopup = () => {
        if (popup.value) {
            popup.value.closeAll();
        }
    };

    return {
        popup,
        tooltip,
        initPopup,
        initTooltip,
        clearPopup
    };
}