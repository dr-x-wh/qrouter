import type {RouteRecordRaw} from "vue-router";
import type {DirectoryRouteGlob, DirectoryRouteMeta} from "./types";

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
    if (entryMap.has(key)) throw new Error(`[vue-directory-router] Duplicate route directory: "${key || "/"}"`);
    entryMap.set(key, entry);
 }
  const roots: RouteEntry[] = [];
  /* 为每一个 meta.{js,ts} 找最近的 meta.{js,ts} 祖先。 */
  for (const entry of entries) {
    const parent = findParentEntry(entry, entryMap);
    if (parent) parent.children.push(entry);
    else roots.push(entry);
 }
  return roots.map(entry => createRouteRecord(entry));
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
  const normalized = normalizeGlobKey(source);
  const match = normalized.match(/^(.*\/)?meta\.(?:js|ts)$/);
  if (!match) throw new Error(`[vue-directory-router] Invalid route meta file: "${source}". Expected "meta.{js,ts}".`);
  const directory = match[1]?.replace(/\/$/, '') ?? '';
  return directory ? directory.split('/').filter(Boolean) : [];
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
  return undefined
}

/**
 * 将 RouteEntry 转换成 Vue Router RouteRecordRaw。
 */
function createRouteRecord(entry: RouteEntry, parent?: RouteEntry): RouteRecordRaw {
  /* 子路由只需要计算相对于父 RouteRecord 多出来的目录部分。 system/meta.{js,ts} system/setting/user/meta.{js,ts} => parent: /system child: setting/user */
  const relativeSegments = parent ? entry.segments.slice(parent.segments.length) : entry.segments;
  const path = createRoutePath(relativeSegments, parent === undefined);
  const children = entry.children.map(child => createRouteRecord(child, entry));
  /* meta 放在前面。即使运行时传入了非法的path / children，这里也会由目录生成结果覆盖。 */
  const {path: _path, children: _children, ...meta} = entry.meta as DirectoryRouteMeta & {path?: unknown; children?: unknown;};
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
