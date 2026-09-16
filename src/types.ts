import type {RouteRecordRaw, RouterOptions} from "vue-router";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, Extract<keyof T, K>> : never;
export type DirectoryRouteMeta = DistributiveOmit<RouteRecordRaw, "path" | "children"> & {
  path?: never;
  children?: never;
  /** 同层路由按数值升序排列，默认值为 0；相同值保留原顺序。 */
  sort?: number;
};
/** 键为相对于扫描根目录的文件路径，值为路由配置；所有条目均参与生成，文件名和扩展名不限。 */
export type DirectoryRouteGlob = Record<string, DirectoryRouteMeta>;
export type CreateDirectoryRouterOptions = Omit<RouterOptions, "routes"> & {glob: DirectoryRouteGlob;};
