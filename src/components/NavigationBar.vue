<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
//获取父组件传递过来的菜单数组
defineProps(['menuList']);
// const props = defineProps({
//     items: {
//         type: Array,
//         required: true
//     }
// });

const emit = defineEmits(['switch']);

const handleClick = (path: string) => {
    emit('switch', path);
};
</script>

<template>
    <div class="bottom-nav">
        <template v-for="(item) in menuList" :key="item.path">
            <template v-if="item.children">
                <template v-for="(navItem, index) in item.children" :key="navItem.path">
                    <div class="nav-item" :class="{ active: navItem.meta.active }" @click="handleClick(navItem.path)">
                        {{ navItem.meta.title }}
                    </div>
                </template>
            </template>
        </template>
    </div>
</template>

<style scoped lang="scss">
.bottom-nav {
    display: flex;
    justify-content: space-around;
    padding: 10px 0;
    // background-color: rgba(4, 25, 37, 0.8);
    border-radius: 5px;

    .nav-item {
        color: #ffffff;
        cursor: pointer;
        padding: 5px 15px;
        border-radius: 3px;
        transition: all 0.3s;

        &:hover,
        &.active {
            background-color: rgba(10, 94, 125, 0.5);
            color: #00ffff;
        }
    }
}
</style>