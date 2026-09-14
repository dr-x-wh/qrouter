import {createRouter, type Router} from "vue-router";
import {createRoutes} from "./create-routes";
import type {CreateDirectoryRouterOptions} from "./types";

/**
 * 根据目录 meta 信息创建 Vue Router 实例。
 *
 * 除 routes 外，其余 RouterOptions 参数原样传递给 createRouter。
 */
export function createDirectoryRouter(options: CreateDirectoryRouterOptions): Router {
  const {glob, ...routerOptions} = options;
  return createRouter({...routerOptions, routes: createRoutes(glob)});
}
