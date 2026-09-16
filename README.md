# qrouter

根据指定目录中的 `meta.ts` 或 `meta.js` 生成 Vue Router 路由配置。Vite 负责扫描和加载文件，本库根据扫描结果生成路由表，也可以直接创建 Router 实例。

## 使用

例如将路由创建代码放在 `src/router/index.ts`，扫描 `src/view`：

```ts
import {createWebHistory} from 'vue-router';
import {createDirectoryRouter, type DirectoryRouteMeta} from '@dr-x/qrouter';

const glob = import.meta.glob<DirectoryRouteMeta>('./**/meta.{js,ts}', {
  base: '../view',
  eager: true,
  import: 'default',
});

export default createDirectoryRouter({
  history: createWebHistory(),
  glob,
});
```

`base` 指定扫描根目录，返回的 key 相对于此目录，例如 `./user/meta.ts`。`eager: true` 和 `import: 'default'` 使每个值直接对应 meta 文件的默认导出。手动提供 glob 对象时也应使用相对于扫描根目录的 key。

如果只需要路由表，可以调用 `createRoutes(glob)`。`createDirectoryRouter` 会将除 `glob` 外的 Router 选项透传给 Vue Router，并使用生成的路由表。

在每个需要生成路由的目录中创建一个 meta 文件：

```ts
import {defineRouteMeta} from '@dr-x/qrouter';

export default defineRouteMeta({
  name: 'user',
  component: () => import('./index'),
  sort: 10,
});
```

`defineRouteMeta` 提供类型提示并原样返回配置。允许空配置 `{}`；组件、名称、重定向、守卫、`props`、`alias`、`meta` 等原生字段直接透传。

## 目录规则

- 每个 meta 文件生成一条路由，同一目录只能有一个 `meta.ts` 或 `meta.js`。
- 父路由是最近的、包含 meta 文件的祖先目录；没有 meta 的目录不会生成路由记录，其目录名仍参与路径计算。
- 顶级 `path` 是绝对路径，子级 `path` 相对于父路由。
- `index` 参与父子层级判断，但其路径片段为空，继承父级路径。
- `[id]` 转为 `:id`，`[...path]` 转为 `:path(.*)`，其他目录名原样作为路径片段。
- `path` 和 `children` 只由目录结构生成。TypeScript 禁止在 meta 中手写这两个字段；运行时也会忽略手写值。

例如：

```text
view/
  meta.ts
  index/
    meta.ts
    user/
      meta.ts
      index/
        meta.ts
      [id]/
        meta.ts
  system/
    settings/
      meta.ts
```

仅展示生成的层级与路径：

```ts
[
  {
    path: '/',
    children: [
      {
        path: '',
        children: [
          {
            path: 'user',
            children: [{path: ':id'}, {path: ''}],
          },
        ],
      },
      {path: 'system/settings'},
    ],
  },
]
```

库不校验路由表的业务正确性：不检查重复路径或名称、重定向目标、组件是否存在等，也不按最终 URL 合并路由记录。

## 排序

根路由和每层 `children` 均按 `sort` 数值从小到大排序。未设置时按 `0` 处理，支持负数；相同值保留 glob 中的原顺序。排序只影响同层顺序，不改变目录的父子关系。`sort` 是目录配置字段，不会传入生成的 Vue Router 路由配置。

## 验证

运行 `yarn test` 执行类型检查、构建和回归测试，覆盖目录生成、Router 集成、Vite 扫描及发布类型声明。
