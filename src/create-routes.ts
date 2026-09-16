import type {RouteRecordRaw} from "vue-router";
import type {DirectoryRouteGlob, DirectoryRouteMeta} from "./types.js";

interface RouteEntry {
  /* glob 原始 key。例如：./system/user/meta.{js,ts} */
  source: string;
  /* 原始目录结构。./system/user/meta.{js,ts}=>["system", "user"]注意：这里不会删除 index，因为 index 仍然参与父子目录关系判断。 */
  segments: string[];
  /* meta.{js,ts} 默认导出的路由信息。 */
  meta: DirectoryRouteMeta;
  /* 直接子路由。 */
  children: RouteEntry[];
}

/**
 * 根据 meta.{js,ts} glob 创建 Vue Router routes。
 */
export function createRoutes(glob: DirectoryRouteGlob): RouteRecordRaw[] {
  const entries = Object.entries(glob).map(([source, meta]) => createEntry(source, meta));
  /* 根据完整目录路径建立索引。system/user=>RouteEntry */
  const entryMap = new Map<string, RouteEntry>();
  for (const entry of entries) {
    const key = createDirectoryKey(entry.segments);
    if (entryMap.has(key)) throw new Error(`[qrouter] 同一目录只能有一个 meta 文件："${key || "/"}"。`);
    entryMap.set(key, entry);
  }
  const roots: RouteEntry[] = [];
  /* 为每一个 meta.{js,ts} 找最近的 meta.{js,ts} 祖先。 */
  for (const entry of entries) {
    const parent = findParentEntry(entry, entryMap);
    if (parent) parent.children.push(entry);
    else roots.push(entry);
  }
  return createRouteRecords(roots);
}

/**
 * 创建内部 RouteEntry。
 */
function createEntry(source: string, meta: DirectoryRouteMeta): RouteEntry {
  return {source, segments: parseDirectorySegments(source), meta, children: []};
}

/**
 * 从 glob key 中提取目录。
 * ./meta.{js,ts} => []
 * ./index/meta.{js,ts} => ["index"]
 * ./system/meta.{js,ts} => ["system"]
 * ./system/user/meta.{js,ts} => ["system", "user"]
 */
function parseDirectorySegments(source: string): string[] {
  const segments = normalizeGlobKey(source).split("/");
  const filename = segments.pop();
  if (filename !== "meta.js" && filename !== "meta.ts") {
    throw new Error(`[qrouter] 无效的 meta 文件："${source}"，文件名必须为 meta.js 或 meta.ts。`);
  }
  return segments.filter(Boolean);
}

/**
 * 标准化 Vite glob key。
 */
function normalizeGlobKey(source: string): string {
  return source.replaceAll("\\", "/").replace(/^\.\/+/, "").replace(/^\/+/, "");
}

/**
 * 创建目录索引 key。
 * ["system", "user"] => system/user
 */
function createDirectoryKey(segments: readonly string[]): string {
  return segments.join("/");
}

/**
 * 查找距离当前路由最近的 meta.{js,ts} 祖先。
 * 例如：system/meta.{js,ts}
 * system/setting/user/meta.{js,ts}
 * user 路由最近的 meta 祖先是 system，
 * 因此最终生成：{path: "/system",children: [{path: "setting/user"}]}
 */
function findParentEntry(entry: RouteEntry, entryMap: ReadonlyMap<string, RouteEntry>): RouteEntry | undefined {
  /* 从直接父目录开始逐级向上寻找。*/
  for (let length = entry.segments.length - 1; length >= 0; length--) {
    const parentSegments = entry.segments.slice(0, length);
    const parent = entryMap.get(createDirectoryKey(parentSegments));
    if (parent) return parent;
  }
  return undefined;
}

/**
 * 对同层路由排序并生成配置，排序值相同时保留 glob 中的原顺序。
 */
function createRouteRecords(entries: readonly RouteEntry[], parent?: RouteEntry): RouteRecordRaw[] {
  return entries
    .toSorted((a, b) => (a.meta.sort ?? 0) - (b.meta.sort ?? 0))
    .map(entry => createRouteRecord(entry, parent));
}

/**
 * 将 RouteEntry 转换成 Vue Router RouteRecordRaw。
 */
function createRouteRecord(entry: RouteEntry, parent?: RouteEntry): RouteRecordRaw {
  /* 子路由只需要计算相对于父 RouteRecord 多出来的目录部分。 system/meta.{js,ts} system/setting/user/meta.{js,ts} => parent: /system child: setting/user */
  const relativeSegments = parent ? entry.segments.slice(parent.segments.length) : entry.segments;
  const path = createRoutePath(relativeSegments, parent === undefined);
  const children = createRouteRecords(entry.children, entry);
  /* sort 仅用于目录排序，path 和 children 由目录结构生成。 */
  const {sort: _sort, path: _path, children: _children, ...meta} = entry.meta as DirectoryRouteMeta & {path?: unknown; children?: unknown;};
  return {...meta, path, ...(children.length > 0 ? {children} : {})} as RouteRecordRaw;
}

/**
 * 根据目录片段生成 route path。
 * 顶级：["system", "user"] => /system/user
 * 子级：["setting", "user"] => setting/user
 * index：["index"] => /
 * 子路由 index：["index"] => ""
 */
function createRoutePath(segments: readonly string[], absolute: boolean): string {
  const path = segments.map(segmentToPath).filter(segment => segment.length > 0).join("/");
  if (!absolute) return path;
  return path ? `/${path}` : "/";
}

/**
 * 单个目录名转换为 Vue Router path segment。
 * index => ""
 * user => user
 * [id] => :id
 * [...path] => :path(.*)
 */
function segmentToPath(segment: string): string {
  if (segment === "index") return "";
  const catchAll = segment.match(/^\[\.\.\.([^\]]+)]$/);
  if (catchAll?.[1]) return `:${catchAll[1]}(.*)`;
  const dynamic = segment.match(/^\[([^\]]+)]$/);
  if (dynamic?.[1]) return `:${dynamic[1]}`;
  return segment;
}
