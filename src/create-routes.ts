import type {RouteRecordRaw} from "vue-router";
import type {DirectoryRouteGlob, DirectoryRouteMeta} from "./types.js";

interface RouteEntry {
  /* glob 原始文件路径，例如：./system/user/route.config.ts。 */
  source: string;
  /* 原始目录结构，例如：["system", "user"]。保留 index，以参与父子目录关系判断。 */
  segments: string[];
  /* 文件对应的路由配置。 */
  meta: DirectoryRouteMeta;
  /* 直接子路由。 */
  children: RouteEntry[];
}

/**
 * 根据外部 glob 的全部条目创建 Vue Router 路由表。
 * 文件名和扩展名由调用方决定，仅根据文件所在目录推导路径和层级。
 * 已提供的 name 必须在本次 glob 中全局唯一，未设置 name 的路由不参与校验。
 * 字符串按原值比较，Symbol 按身份比较。
 *
 * @throws 名称重复时抛出错误，包含冲突名称及两个配置文件路径。
 */
export function createRoutes(glob: DirectoryRouteGlob): RouteRecordRaw[] {
  const entries = Object.entries(glob).map(([source, meta]) => createEntry(source, meta));
  /* 根据完整目录路径和已提供的名称建立全局索引。 */
  const entryMap = new Map<string, RouteEntry>();
  const nameMap = new Map<NonNullable<DirectoryRouteMeta["name"]>, RouteEntry>();
  for (const entry of entries) {
    const key = createDirectoryKey(entry.segments);
    if (entryMap.has(key)) throw new Error(`[qrouter] 同一目录只能有一个路由配置文件："${key || "/"}"。`);
    entryMap.set(key, entry);

    const name = entry.meta.name;
    if (name !== undefined) {
      const duplicate = nameMap.get(name);
      if (duplicate) {
        throw new Error(`[qrouter] 路由名称重复："${String(name)}"，冲突文件："${duplicate.source}" 和 "${entry.source}"。`);
      }
      nameMap.set(name, entry);
    }
  }
  const roots: RouteEntry[] = [];
  /* 为每条路由寻找最近的、包含配置的祖先目录。 */
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
 * 从 glob 文件路径中提取目录，末尾的文件名不参与路由生成。
 * ./route.config.ts => []
 * ./index/route.config.ts => ["index"]
 * ./system/route.config.ts => ["system"]
 * ./system/user/route.config.ts => ["system", "user"]
 */
function parseDirectorySegments(source: string): string[] {
  return normalizeGlobKey(source).split("/").slice(0, -1).filter(Boolean);
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
 * 查找距离当前路由最近的、包含路由配置的祖先目录。
 * 例如：system/route.config.ts
 * system/setting/user/route.config.ts
 * user 路由最近的已配置祖先是 system，
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
  /* 子路由使用相对于父路由的目录片段，例如：system 与 system/setting/user => 父路径 /system，子路径 setting/user。 */
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
