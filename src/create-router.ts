import {createRouter, type Router} from "vue-router";
import {createRoutes} from "./create-routes.js";
import type {CreateDirectoryRouterOptions} from "./types.js";

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
 * Vite `import.meta.glob()` 的扫描结果，键相对于扫描根目录，值为默认导出。
 * base 指定扫描根目录，eager: true 直接加载配置，import: 'default' 取得默认导出。
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
 * 在 src/router/index.ts 中扫描 src/view：
 *
 * ```ts
 * import {createWebHistory} from 'vue-router';
 * import {createDirectoryRouter, type DirectoryRouteMeta} from '@dr-x/qrouter';
 *
 * export default createDirectoryRouter({
 *   history: createWebHistory(),
 *   glob: import.meta.glob<DirectoryRouteMeta>(
 *     './**\/meta.{js,ts}',
 *     {
 *       base: '../view',
 *       eager: true,
 *       import: 'default',
 *     },
 *   ),
 * });
 * ```
 *
 * 示例中的 `\/` 是字符串的斜杠转义，等同于 `/`，可直接复制使用。
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
