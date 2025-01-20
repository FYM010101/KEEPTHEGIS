import { createRouter, createWebHashHistory } from "vue-router"
//@ts-ignore
import { constantRoute } from './routes'

const router = createRouter({
    history: createWebHashHistory(),
    routes: constantRoute
})
export default router;