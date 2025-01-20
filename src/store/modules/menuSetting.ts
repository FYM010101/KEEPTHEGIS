//创建用户相关的小仓库
import { defineStore } from 'pinia'
import { constantRoute } from '../../router/routes'
const useMenuSettingStore = defineStore('MenuSettingStore', {
  state: () => {
    return {
      menuList: constantRoute
    }
  },
})
//对外暴露获取小仓库方法
export default useMenuSettingStore
