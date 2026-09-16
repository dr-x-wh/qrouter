import type {DirectoryRouteMeta} from "./types";

export {createDirectoryRouter} from "./create-router";
export {createRoutes} from "./create-routes";
export type {CreateDirectoryRouterOptions, DirectoryRouteGlob, DirectoryRouteMeta} from "./types";

/**
 * 定义当前目录对应的路由配置。
 *
 * 该方法主要用于为 `meta.{js,ts}` 提供 TypeScript 类型提示。
 * 方法不会修改传入对象，运行时会原样返回。
 *
 * `path` 和 `children` 由目录结构自动生成，不需要手动配置。
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
 * export default defineRouteMeta({
 *   name: 'user',
 *   component: () => import('./index'),
 * })
 *
 * @example
 * 带 meta 和 props：
 *
 * export default defineRouteMeta({
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
 * export default defineRouteMeta({
 *   redirect: {
 *     name: 'home',
 *   },
 * })
 */
export function defineRouteMeta<const T extends DirectoryRouteMeta, >(meta: T): T {
  return meta;
}
