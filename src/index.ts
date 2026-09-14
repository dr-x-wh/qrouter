import type {DirectoryRouteMeta,} from './types'

export {
  createDirectoryRouter,
} from './create-router'

export {
  createRoutes,
} from './create-routes'

export type {
  CreateDirectoryRouterOptions,
  DirectoryComponentGlob,
  DirectoryComponentLoader,
  DirectoryMetaGlob,
  DirectoryRouteMeta,
  DirectoryRouterGlob,
} from './types'

export function defineRouteMeta<
  T extends DirectoryRouteMeta,
>(
  meta: T,
): T {
  return meta
}
