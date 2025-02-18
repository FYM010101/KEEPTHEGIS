<template>
    <div class="logo" v-if="setting.logoDisplay">
        <img :src="setting.logo" alt=""/>
        <p>{{ setting.title }}</p>
    </div>
</template>

<script setup lang="ts">
//引入设置标题与logo这配置文件
//@ts-ignore
import setting from '@/setting';
</script>
<script lang="ts">
export default {
    name: "Logo"
}
</script>
<style scoped lang="scss">
.logo {
    width: $base-logo-width;
    height: $base-menu-height;
    color: white;
    display: flex;
    align-items: center;
    padding: 10px;
    // background: $base-menu-background;

    img {
        width: 40px;
        height: 40px;
    }

    p {
        font-size: $base-logo-title-fontSize;
        margin-left: 10px;
    }
}
</style>