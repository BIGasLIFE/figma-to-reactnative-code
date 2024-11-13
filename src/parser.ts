import { ComponentData, Padding } from "./types";

// 型ガード関数の改善
interface LayoutMixin {
  layoutMode: "HORIZONTAL" | "VERTICAL";
  primaryAxisAlignItems: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems: "MIN" | "CENTER" | "MAX";
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  itemSpacing: number;
}

interface HasFillsMixin {
  fills: ReadonlyArray<Paint>;
}

interface HasChildrenMixin {
  children: ReadonlyArray<SceneNode>;
}

// 型ガード関数
function isLayoutNode(node: SceneNode): node is SceneNode & LayoutMixin {
  return (
    "layoutMode" in node &&
    "primaryAxisAlignItems" in node &&
    "counterAxisAlignItems" in node &&
    "paddingLeft" in node &&
    "paddingRight" in node &&
    "paddingTop" in node &&
    "paddingBottom" in node &&
    "itemSpacing" in node
  );
}

function hasFills(node: SceneNode): node is SceneNode & HasFillsMixin {
  return "fills" in node;
}

function hasChildren(node: SceneNode): node is SceneNode & HasChildrenMixin {
  return "children" in node;
}

function isSolidPaint(paint: Paint): paint is SolidPaint {
  return paint.type === "SOLID";
}

export function parseNode(node: SceneNode): ComponentData {
  try {
    const baseProps: ComponentData = {
      name: node.name.trim(),
      type: node.type,
    };

    if ("width" in node && "height" in node) {
      baseProps.width = Math.round(node.width);
      baseProps.height = Math.round(node.height);
    }

    if (isLayoutNode(node)) {
      baseProps.layoutMode = node.layoutMode;
      baseProps.primaryAxisAlignItems = node.primaryAxisAlignItems;
      baseProps.counterAxisAlignItems = node.counterAxisAlignItems;

      const padding: Padding = {};

      const hasHorizontalPadding =
        node.paddingLeft > 0 || node.paddingRight > 0;

      const hasVerticalPadding = node.paddingTop > 0 || node.paddingBottom > 0;

      if (hasHorizontalPadding) {
        padding.horizontal = {
          left: Math.round(node.paddingLeft),
          right: Math.round(node.paddingRight),
        };
      }

      if (hasVerticalPadding) {
        padding.vertical = {
          top: Math.round(node.paddingTop),
          bottom: Math.round(node.paddingBottom),
        };
      }

      if (hasHorizontalPadding || hasVerticalPadding) {
        baseProps.padding = padding;
      }

      if (node.itemSpacing > 0) {
        baseProps.itemSpacing = Math.round(node.itemSpacing);
      }
    }

    if (hasFills(node)) {
      const solidFill = node.fills
        .filter((fill) => fill.visible !== false)
        .find(isSolidPaint);

      if (solidFill) {
        baseProps.backgroundColor = {
          r: solidFill.color.r,
          g: solidFill.color.g,
          b: solidFill.color.b,
          a: solidFill.opacity ?? 1,
        };
      }
    }

    if (hasChildren(node)) {
      const validChildren = node.children
        .filter((child): child is SceneNode => !child.removed)
        .map((child) => parseNode(child));

      if (validChildren.length > 0) {
        baseProps.children = validChildren;
      }
    }

    return baseProps;
  } catch (error) {
    console.error(`Error parsing node "${node.name}":`, error);
    return {
      name: node.name,
      type: node.type,
    };
  }
}

// 型安全なユーティリティ関数
export function isVisibleNode(node: SceneNode): boolean {
  return node.visible !== false;
}

export function isContainer(node: SceneNode): boolean {
  return (
    node.type === "FRAME" ||
    node.type === "COMPONENT" ||
    node.type === "INSTANCE" ||
    node.type === "GROUP"
  );
}

export function hasVisibleFills(node: SceneNode): boolean {
  return (
    hasFills(node) &&
    node.fills.filter((fill) => fill.visible !== false).some(isSolidPaint)
  );
}
