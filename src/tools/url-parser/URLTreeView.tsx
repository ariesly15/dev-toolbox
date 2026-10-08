import type {
  URLTreeNode,
  TreeNodeProps,
  BreadcrumbItem,
  URLBreadcrumbProps,
  URLTreeViewProps,
} from "@/interface";
import { clsx } from "clsx";

// 为树节点按深度优先分配序号标签
export function assignTags(node: URLTreeNode, counter = { n: 1 }): Map<string, string> {
  const tags = new Map<string, string>();
  const walk = (n: URLTreeNode) => {
    tags.set(n.url, `#${counter.n++}`);
    for (const child of n.children) walk(child.node);
  };
  walk(node);
  return tags;
}

function TreeNode(props: TreeNodeProps & { paramName?: string }) {
  const { node, path, activePath, tags, paramName, onSelect } = props;
  const isActive = activePath.length === path.length && activePath.every((v, i) => v === path[i]);
  const tag = tags.get(node.url) ?? "";

  return (
    <div className="url-tree-node">
      <div className="url-tree-item">
        <button
          className={clsx("url-tree-label", isActive && "active")}
          title={node.url}
          onClick={() => onSelect(path)}
        >
          <span className="url-tree-tag">{tag}</span>
          {paramName && <span className="url-tree-param">{paramName}</span>}
          {node.label}
        </button>
        {node.children.length > 0 && (
          <div className="url-tree-children">
            {node.children.map((child, i) => (
              <TreeNode
                key={i}
                node={child.node}
                path={[...path, i]}
                activePath={activePath}
                onSelect={onSelect}
                tags={tags}
                paramName={child.paramName}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// prettier-ignore
function buildBreadcrumbPath(root: URLTreeNode, activePath: number[], tags: Map<string, string>): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: root.label, tag: tags.get(root.url) ?? "", path: [] }];
  let current = root;
  const currentPath: number[] = [];

  for (const idx of activePath) {
    if (idx >= current.children.length) break;
    currentPath.push(idx);
    current = current.children[idx].node;
    items.push({ label: current.label, tag: tags.get(current.url) ?? "", path: [...currentPath] });
  }

  return items;
}

export function URLBreadcrumb(props: URLBreadcrumbProps) {
  const { root, activePath, onSelect, tags } = props;
  const breadcrumb = buildBreadcrumbPath(root, activePath, tags);

  const handleSelect = (evt: React.MouseEvent<HTMLButtonElement>, path: number[]) => {
    evt.stopPropagation();
    onSelect(path);
  };

  if (breadcrumb.length <= 1) return null;

  return (
    <nav className="url-breadcrumb">
      {breadcrumb.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="url-breadcrumb-sep">›</span>}
          <button
            className={clsx("url-breadcrumb-item", i === breadcrumb.length - 1 && "current")}
            onClick={(evt) => handleSelect(evt, item.path)}
            title={item.label}
          >
            {item.tag}
          </button>
        </span>
      ))}
    </nav>
  );
}

export default function URLTreeView(props: URLTreeViewProps) {
  const { root, activePath, onSelect, tags } = props;

  return (
    <div className="url-tree-view">
      {/* 树形视图（仅在有多于 1 个节点时显示） */}
      {root.children.length > 0 && (
        <div className="url-tree-container">
          <TreeNode node={root} path={[]} activePath={activePath} onSelect={onSelect} tags={tags} />
        </div>
      )}
    </div>
  );
}
