//创建用户相关的小仓库
import { defineStore } from 'pinia'
const useLeftMenuStore = defineStore('LeftMenuStore', {
    state: () => {
        return {
            leftMenuList: [
                {
                    name: 'layer',
                    meta: {
                        title: '图层',
                        icon: 'CopyDocument',
                    },
                    children: [
                        {
                            name: 'Image',
                            meta: {
                                title: '影像',
                                icon: 'PictureRounded',
                            },
                            children: [
                                {
                                    name: 'wmts',
                                    meta: {
                                        title: 'wmts服务',
                                        // icon: 'Grid',
                                    }
                                },
                                {
                                    name: 'tdt',
                                    meta: {
                                        title: '天地图服务',
                                        // icon: 'PictureFilled',
                                    }
                                }
                            ]
                        },
                        {
                            name: 'Entity',
                            meta: {
                                title: 'Entity',
                                icon: 'User',
                            },
                        },
                        {
                            name: 'Primitive',
                            meta: {
                                title: 'Primitive',
                                icon: 'UserFilled',
                            },
                        },
                    ],
                },
                {
                    name: 'material',
                    meta: {
                        title: '材质',
                        icon: 'Goods',
                    },
                    children: [
                        {
                            name: 'radar',
                            meta: {
                                title: '雷达',
                                icon: 'ShoppingCartFull',
                            },
                        },
                        {
                            name: 'StreamerLine',
                            meta: {
                                title: '流光线',
                                icon: 'ChromeFilled',
                            },
                        },
                    ],
                },
            ]
        }
    },
})

export default useLeftMenuStore