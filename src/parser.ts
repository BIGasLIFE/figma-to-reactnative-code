import { ComponentData } from "./types";

// 変数取得用の型と関数
interface VariableReference {
  id: string;
  name?: string;
}

interface VariableBindings {
  [key: string]: VariableReference;
}

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
  layoutSizingHorizontal: "FIXED" | "HUG" | "FILL";
  layoutSizingVertical: "FIXED" | "HUG" | "FILL";
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

// 型ガード関数
function hasVariableBindings(
  node: SceneNode
): node is SceneNode & { boundVariables: VariableBindings } {
  return "boundVariables" in node;
}

async function getVariableName(
  node: SceneNode,
  property: string
): Promise<string | undefined> {
  if (hasVariableBindings(node) && node.boundVariables[property]) {
    try {
      const variableId = node.boundVariables[property].id;
      const variable = await figma.variables.getVariableByIdAsync(variableId);

      if (variable) {
        const collection = await figma.variables.getVariableCollectionByIdAsync(
          variable.variableCollectionId
        );
        if (collection) {
          return `${collection.name}/${variable.name}`;
        }
      }
    } catch (error) {
      console.error(`Error getting variable name for ${property}:`, error);
    }
  }
  return undefined;
}

export async function parseNode(node: SceneNode): Promise<ComponentData> {
  try {
    const baseProps: ComponentData = {
      name: node.name.trim(),
      type: node.type,
    };

    if ("width" in node && "height" in node) {
      baseProps.width = Math.round(node.width);
      baseProps.height = Math.round(node.height);
    }

    // 高さの判定

    if (node.type === "TEXT") {
      baseProps.characters = node.characters;
    }

    if (isLayoutNode(node)) {
      // レイアウトの設定
      baseProps.layoutMode = node.layoutMode;
      baseProps.primaryAxisAlignItems = node.primaryAxisAlignItems;
      baseProps.counterAxisAlignItems = node.counterAxisAlignItems;

      // 幅の判定
      baseProps.layoutSizingHorizontal = node.layoutSizingHorizontal;
      baseProps.layoutSizingVertical = node.layoutSizingVertical;

      // paddingの処理
      const padding: ComponentData["padding"] = {};

      const hasHorizontalPadding =
        node.paddingLeft > 0 || node.paddingRight > 0;

      const hasVerticalPadding = node.paddingTop > 0 || node.paddingBottom > 0;

      if (hasHorizontalPadding) {
        padding.horizontal = {
          left: {
            value: Math.round(node.paddingLeft),
            variableName: await getVariableName(node, "paddingLeft"),
          },
          right: {
            value: Math.round(node.paddingRight),
            variableName: await getVariableName(node, "paddingRight"),
          },
        };
      }

      if (hasVerticalPadding) {
        padding.vertical = {
          top: {
            value: Math.round(node.paddingTop),
            variableName: await getVariableName(node, "paddingTop"),
          },
          bottom: {
            value: Math.round(node.paddingBottom),
            variableName: await getVariableName(node, "paddingBottom"),
          },
        };
      }

      if (hasHorizontalPadding || hasVerticalPadding) {
        baseProps.padding = padding;
      }

      if (node.itemSpacing > 0) {
        baseProps.itemSpacing = {
          value: Math.round(node.itemSpacing),
          variableName: await getVariableName(node, "itemSpacing"),
        };
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
        const validChildren = await Promise.all(
          node.children
            .filter((child): child is SceneNode => !child.removed)
            .map((child) => parseNode(child))
        );

        if (validChildren.length > 0) {
          baseProps.children = validChildren;
        }
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
