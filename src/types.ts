import type {Component} from 'vue'
import type {RouteRecordRaw, RouterOptions,} from 'vue-router'

export type DirectoryComponentLoader =
  () => Promise<Component>

export type DirectoryComponentGlob =
  Record<string, DirectoryComponentLoader>

export type DirectoryRouteMeta =
  Partial<
    Pick<
      RouteRecordRaw,
      | 'name'
      | 'meta'
      | 'alias'
      | 'redirect'
      | 'props'
      | 'beforeEnter'
    >
  >

export type DirectoryMetaGlob =
  Record<string, DirectoryRouteMeta>

export interface DirectoryRouterGlob {
  components: DirectoryComponentGlob
  metas?: DirectoryMetaGlob
}

export type CreateDirectoryRouterOptions =
  Omit<RouterOptions, 'routes'> & {
  glob: DirectoryRouterGlob
}
