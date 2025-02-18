<template>
    <el-button :type="type" :size="size" :icon="icon" :round="round" :circle="circle" :disabled="disabled"
        :style="customStyle" @click="handleClick" @mouseover="handleHover">
        <slot>{{ text }}</slot>
    </el-button>
</template>

<script setup lang="ts">

defineProps({
    text: String,            // 按钮文本
    type: {                  // 按钮类型（Element Plus 预设）
        type: String,
         // 可选: primary / success / warning / danger / info / text
    },
    size: {                  // 按钮大小
        type: String,
        default: "default",    // 可选: large / default / small
    },
    icon: String,            // 按钮图标
    round: Boolean,          // 是否圆角
    circle: Boolean,         // 是否圆形按钮
    disabled: Boolean,       // 是否禁用
    customStyle: Object,     // 自定义样式
});

const emit = defineEmits(["click", "hover"]);

const handleClick = (event: any) => {
    emit("click", event);   // 触发点击事件
};

const handleHover = (event: any) => {
    emit("hover", event);   // 触发悬停事件
};
</script>
