import type {DirectoryRouteMeta} from "./types";

export {createDirectoryRouter} from "./create-router";
export {createRoutes} from "./create-routes";
export type {CreateDirectoryRouterOptions, DirectoryRouteGlob, DirectoryRouteMeta} from "./types";

export function defineRouteMeta<const T extends DirectoryRouteMeta, >(meta: T): T {
  return meta;
}
