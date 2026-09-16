import {createRouter, type Router} from "vue-router";
import {createRoutes} from "./create-routes";
import type {CreateDirectoryRouterOptions} from "./types";

/**
 * 根据 `meta.{js,ts}` 的 glob 结果自动生成 routes，
 * 并创建 Vue Router 实例。
 *
 * 除 `routes` 外，其余参数均原样传递给
 * Vue Router 的 `createRouter()`。
 *
 * @param options 路由创建参数。
 *
 * options.glob：
 * Vite `import.meta.glob()` 的扫描结果。
 *
 * options.history：
 * Vue Router 的 history，例如 `createWebHistory()`。
 *
 * 其他参数：
 * 均为 Vue Router 原生 RouterOptions，
 * 例如 strict、scrollBehavior、linkActiveClass 等。
 *
 * @returns 创建完成的 Vue Router 实例。
 *
 * @example
 * 基础用法：
 *
 * export default createDirectoryRouter({
 *   history: createWebHistory(),
 *   glob: import.meta.glob<DirectoryRouteMeta>(
 *     './** /meta.{js,ts}',
 *     {
 *       base: '../view',
 *       eager: true,
 *       import: 'default',
 *     },
 *   ),
 * })
 *
 * @example
 * 透传 Vue Router 配置：
 *
 * export default createDirectoryRouter({
 *   history: createWebHistory(),
 *   glob,
 *   strict: true,
 *   scrollBehavior(_to, _from, savedPosition) {
 *     return savedPosition ?? { top: 0 }
 *   },
 * })
 *
 * @example
 * 目录与路径：
 *
 * view/index/meta.{js,ts}         => /
 * view/user/meta.{js,ts}          => /user
 * view/user/[id]/meta.{js,ts}     => /user/:id
 * view/system/index/meta.{js,ts}  => /system
 */
export function createDirectoryRouter(options: CreateDirectoryRouterOptions): Router {
  const {glob, ...routerOptions} = options;
  return createRouter({...routerOptions, routes: createRoutes(glob)});
}
