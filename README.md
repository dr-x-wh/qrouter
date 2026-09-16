# qrouter

根据传入的 glob 结果生成 Vue Router 路由配置。调用方负责指定扫描根目录、选择文件并加载配置，本库直接处理所有传入条目，根据文件所在目录生成路由表，也可以直接创建 Router 实例。配置文件的名称和扩展名由调用方自行决定。

## 使用

例如将路由创建代码放在 `src/router/index.ts`，扫描 `src/view`：

```ts
import {createWebHistory} from 'vue-router';
import {createDirectoryRouter, type DirectoryRoute} from '@dr-x/qrouter';

const glob = import.meta.glob<DirectoryRoute>('./**/route.config.ts', {
  base: '../view',
  eager: true,
  import: 'default',
});

export default createDirectoryRouter({
  history: createWebHistory(),
  glob,
});
```

`base` 指定扫描根目录，glob 模式指定配置文件范围，返回的 key 相对于此目录，例如 `./user/route.config.ts`。`eager: true` 和 `import: 'default'` 使每个值直接对应配置文件的默认导出。`route.config.ts` 只是示例命名，可以按需要替换 glob 模式。本库不会根据文件名或扩展名再次筛选。手动提供 glob 对象时也应使用相对于扫描根目录的文件路径作为 key。

如果只需要路由表，可以调用 `createRoutes(glob)`。`createDirectoryRouter` 会将除 `glob` 外的 Router 选项透传给 Vue Router，并使用生成的路由表。

在每个需要生成路由的目录中创建一个配置文件，例如 `route.config.ts`：

```ts
import {defineRoute} from '@dr-x/qrouter';

export default defineRoute({
  name: 'user',
  component: () => import('./index'),
  sort: 10,
});
```

`defineRoute` 提供类型提示并原样返回配置。允许空配置 `{}`；组件、名称、重定向、守卫、`props`、`alias`、`meta` 等原生字段直接透传。

## 目录规则

- 每个传入的配置文件生成一条路由，同一目录只能传入一个配置文件。文件名和扩展名不参与路径或层级计算。
- 所有已提供的 `name` 必须全局唯一，包括不同层级的路由。字符串按原值比较，区分大小写和空白；Symbol 按身份比较。未设置或为 `undefined` 的名称不参与校验，空字符串参与校验。名称重复时，错误会指出名称和两个冲突的配置文件路径。
- 父路由是最近的、包含已传入配置文件的祖先目录；没有传入配置的目录不会生成路由记录，其目录名仍参与路径计算。
- 顶级 `path` 是绝对路径，子级 `path` 相对于父路由。
- `index` 参与父子层级判断，但其路径片段为空，继承父级路径。
- `[id]` 转为 `:id`，`[...path]` 转为 `:path(.*)`，其他目录名原样作为路径片段。
- `path` 和 `children` 只由目录结构生成。TypeScript 禁止在配置中手写这两个字段；运行时也会忽略手写值。

例如：

```text
view/
  route.config.ts
  index/
    route.config.ts
    user/
      route.config.ts
      index/
        route.config.ts
      [id]/
        route.config.ts
  system/
    settings/
      route.config.ts
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

库不检查重复路径、重定向目标、组件是否存在等其他路由业务配置，也不按最终 URL 合并路由记录。

## 排序

根路由和每层 `children` 均按 `sort` 数值从小到大排序。未设置时按 `0` 处理，支持负数；相同值保留 glob 中的原顺序。排序只影响同层顺序，不改变目录的父子关系。`sort` 是目录配置字段，不会传入生成的 Vue Router 路由配置。

## 验证

运行 `yarn test` 执行类型检查、构建和路由名称校验测试。
