import {createRouter, type Router,} from 'vue-router'

import {createRoutes} from './create-routes'

import type {CreateDirectoryRouterOptions,} from './types'

export function createDirectoryRouter(
  options: CreateDirectoryRouterOptions,
): Router {
  const {
    glob,
    ...routerOptions
  } = options

  return createRouter({
    ...routerOptions,
    routes: createRoutes(glob),
  })
}
