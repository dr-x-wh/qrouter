# qrouter

在目录的 `meta.ts` 或 `meta.js` 中使用 `sort` 配置同层路由的顺序：

```ts
import {defineRouteMeta} from '@dr-x/qrouter';

export default defineRouteMeta({
  name: 'user',
  component: () => import('./index'),
  sort: 10,
});
```

根路由和每层 `children` 均按 `sort` 数值从小到大排序。未设置时按 `0` 处理，支持负数；相同值保留 glob 中的原顺序。排序只影响同层顺序，不改变目录的父子关系。`sort` 是目录配置字段，不会传入生成的 Vue Router 路由配置。
