<template>
    <div class="tree-menu">
        <el-tree :data="treeData" :props="defaultProps" node-key="id" show-checkbox default-expand-all
            @check-change="handleCheckChange" class="custom-tree">
            <!-- 自定义节点内容 -->
            <template #default="{ data }">
                <div class="tree-node">
                    <!-- 节点前的图标 -->
                    <i class="el-icon-house node-icon"></i>

                    <!-- 节点标签 -->
                    <span class="node-label">{{ data.label }}</span>

                    <!-- 节点右侧按钮 -->
                    <span class="node-actions">
                        <span class="node-info">{{ data.count || '0条' }}</span>
                        <el-button size="mini" circle type="Location" icon="el-icon-location" @click="handleLocate(data)" />
                    </span>
                </div>
            </template>
        </el-tree>
    </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import * as Cesium from 'cesium';
//@ts-ignore
import useMapStore from '@/store/modules/mapStore';

const mapStore = useMapStore();

// 树状结构数据
const treeData = reactive([
    {
        id: 1,
        label: '机场',
        count: '1条',
        children: [],
    },
    {
        id: 2,
        label: '摄像头',
        count: '1条',
        layerKey: 'camera',
        location: {
            destination: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 500000.0), // 纽约
            orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(-30.0),
                roll: 0.0,
            },
        },
    },
    {
        id: 3,
        label: '水系',
        count: '2条',
        children: [],
    },
    {
        id: 4,
        label: '模型',
        count: '4条',
        children: [],
    },
]);

// Element Plus 树组件的默认配置
const defaultProps = {
    children: 'children',
    label: 'label',
};

// 图层显示与隐藏
const handleCheckChange = (data: any, checked: boolean) => {
    console.log(data, checked);
    // 根据逻辑实现图层显示隐藏
};

// 定位到图层
const handleLocate = (data: any) => {
    if (!data.location || !mapStore.viewer) return;

    const { destination, orientation } = data.location;

    mapStore.viewer.camera.flyTo({
        destination,
        orientation,
        duration: 2.0,
    });
};

</script>

<style scoped>
.tree-menu {
    width: 300px;
    height: 500px;
    top: 100px;
    left: 100px;
    padding: 16px;
    background-color: #1e2a3c;
    /* 背景颜色 */
    border-radius: 8px;
    /* color: #ffffff; */
}

.custom-tree {
    font-size: 14px;
    color: #c0c4cc;
}

/* 自定义节点样式 */
.tree-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.3s;
}

.tree-node:hover {
    background-color: #29374d;
}

/* 节点图标 */
.node-icon {
    margin-right: 8px;
    color: #409eff;
}

/* 节点标签 */
.node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 节点操作区域 */
.node-actions {
    display: flex;
    align-items: center;
}

.node-info {
    margin-right: 8px;
    font-size: 12px;
    color: #909399;
}
</style>
