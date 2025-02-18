<template>
  <el-upload
    action=""
    :auto-upload="false"
    :show-file-list="true"
    :on-change="handleFileChange"
    accept=".geojson,.json"
  >
    <el-button type="primary">上传 GeoJSON</el-button>
  </el-upload>
</template>

<script setup lang="ts">
import { useLayerStore } from "../store/modules/layerStore";
import type { UploadFile } from "element-plus"; // 引入 Element Plus 上传文件类型

const layerStore = useLayerStore();

// 处理文件上传
const handleFileChange = (file: UploadFile) => {
  const reader = new FileReader();

  reader.onload = (event) => {
    if (!event.target?.result) {
      console.error("文件读取失败");
      return;
    }

    try {
      const geojson = JSON.parse(event.target.result as string); // 解析 GeoJSON 数据
      layerStore.addLayer({
        id: Date.now().toString(), // 确保 ID 为字符串
        name: file.name,
        data: geojson,
        visible: true,
        style: { color: "#ff0000", opacity: 0.8 },
      });
    } catch (error) {
      console.error("文件解析失败:", error);
    }
  };

  if (file.raw) {
    reader.readAsText(file.raw); // 读取文件内容
  } else {
    console.error("无效的文件");
  }
};
</script>
