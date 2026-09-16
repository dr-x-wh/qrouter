import type {DirectoryRoute} from "./types.js";

export {createDirectoryRouter} from "./create-router.js";
export {createRoutes} from "./create-routes.js";
export type {CreateDirectoryRouterOptions, DirectoryRouteGlob, DirectoryRoute} from "./types.js";

/**
 * 定义当前目录对应的路由配置。
 *
 * 该方法为路由配置提供 TypeScript 类型提示，配置文件名称与扩展名可自定义。
 * 方法不会修改传入对象，运行时会原样返回。
 *
 * `path` 和 `children` 由目录结构自动生成，不需要手动配置。
 * `sort` 控制同层路由的升序排列，默认值为 0，相同值保留原顺序。
 * `name` 可以省略；提供时必须在传入的全部配置中唯一，生成路由时统一校验。
 * 字符串按原值比较，Symbol 按身份比较。
 *
 * @param meta 当前目录对应的路由配置。
 * 可配置 Vue Router 原生字段，例如：
 * name、component、redirect、props、beforeEnter、meta 等。
 *
 * @returns 原样返回传入的路由配置对象。
 *
 * @example
 * 普通页面：
 *
 * export default defineRoute({
 *   name: 'user',
 *   sort: 10,
 *   component: () => import('./index'),
 * })
 *
 * @example
 * 带 meta 和 props：
 *
 * export default defineRoute({
 *   name: 'user-detail',
 *   component: () => import('./index'),
 *   props: true,
 *   meta: {
 *     title: '用户详情',
 *     requiresAuth: true,
 *   },
 * })
 *
 * @example
 * 重定向：
 *
 * export default defineRoute({
 *   redirect: {
 *     name: 'home',
 *   },
 * })
 */
export function defineRoute<const T extends DirectoryRoute>(meta: T): T {
  return meta;
}
