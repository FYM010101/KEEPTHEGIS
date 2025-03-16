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
    // background: rgba(4, 25, 37, 0.8);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 30px rgba(0, 102, 255, 0.1);
    display: flex;
    justify-content: space-around;
    padding: 10px 0;
    // background-color: rgba(4, 25, 37, 0.8);
    // border-radius: 5px;

    .nav-item {
        color: #ffffff;
        cursor: pointer;
        padding: 8px 15px;
        position: relative;
        text-align: center;
        margin-right: 5px;
        justify-content: center;
        

        &::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 3px;
            border: 1px solid transparent;
            transition: all 0.3s;
        }

        &:hover,
        &.active {
            background: linear-gradient(45deg, rgba(10, 94, 125, 0.8), rgba(0, 191, 255, 0.3));
            color: #00ffff;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);

            &::after {
                border-color: rgba(0, 255, 255, 0.5);
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            }
        }

        &.active {
            animation: glow 1.5s ease-in-out infinite alternate;
        }
    }
}

@keyframes glow {
    from {
        box-shadow: 0 0 5px rgba(0, 255, 255, 0.2),
            0 0 10px rgba(0, 255, 255, 0.1);
    }

    to {
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.4),
            0 0 20px rgba(0, 255, 255, 0.2);
    }
}
</style>