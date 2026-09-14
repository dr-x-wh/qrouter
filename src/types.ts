import type {RouteRecordRaw, RouterOptions} from "vue-router";

type DistributiveOmit<T, K extends PropertyKey, > = T extends unknown ? Omit<T, Extract<keyof T, K>> : never;
export type DirectoryRouteMeta = DistributiveOmit<RouteRecordRaw, "path" | "children"> & {path?: never; children?: never;};
export type DirectoryRouteGlob = Record<string, DirectoryRouteMeta>;
export type CreateDirectoryRouterOptions = Omit<RouterOptions, "routes"> & {glob: DirectoryRouteGlob;};
