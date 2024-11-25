import { ComponentData, VariableInfo } from "./types";

interface StyleProps {
  flex?: number;
  width?: number | string;
  height?: number | string;
  backgroundColor?: string;
  flexDirection?: "row" | "column";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between";
  padding?: number | string;
  paddingTop?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  gap?: number | string;
  flexWrap?: "wrap" | "nowrap";
  flexGrow?: number;
  margin?: number | string;
  marginTop?: number | string;
  marginRight?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
}

// interface DimensionVariable {
//   name: string;
//   value: number;
//   variableName?: string;
// }

export class CodeGenerator {
  // private variables: Set<DimensionVariable> = new Set();
  private variableNames: Set<string> = new Set();

  private getElementType(nodeData: ComponentData): string {
    switch (nodeData.type) {
      case "TEXT":
        return "Text";
      case "FRAME":
      case "COMPONENT":
      case "INSTANCE":
      case "GROUP":
        return "View";
      default:
        return "View";
    }
  }

  private isComponent(node: ComponentData): boolean {
    return node.type === "COMPONENT" || node.type === "INSTANCE";
  }

  private generateVariableName(name: string): string {
    const paths = name.split("/");
    const firstPath = this.toLowerFirstChar(paths[0]);
    const keyNamesText = paths
      .splice(1)
      .map((path) => `['${this.toLowerFirstChar(path)}']`);

    return `${firstPath}${keyNamesText.join("")}`;
  }

  private generateVariable(variableInfo: VariableInfo): number | string {
    if (variableInfo.variableName !== undefined) {
      return `##${this.generateVariableName(variableInfo.variableName)}##`;
    } else {
      return variableInfo.value;
    }
  }

  private convertToReactNativeStyle(
    nodeData: ComponentData,
    parentLayout?: string
  ): StyleProps {
    const style: StyleProps = {};

    // レイアウトの処理
    if (nodeData.layoutMode) {
      style.flex = 1;
      style.flexDirection =
        nodeData.layoutMode === "HORIZONTAL" ? "row" : "column";

      if (parentLayout === "HORIZONTAL") {
        style.flex = 1;
      }
    }

    // サイズの処理
    switch (nodeData.layoutSizingHorizontal) {
      case "FIXED":
        style.width = nodeData.width;
        break;
      case "FILL":
        style.flexGrow = 1;
        break;
      case "HUG":
      default:
        break;
    }
    switch (nodeData.layoutSizingVertical) {
      case "FIXED":
        style.height = nodeData.height;
        break;
      case "FILL":
        style.flexGrow = 1;
        break;
      case "HUG":
      default:
        break;
    }

    // 背景色の処理
    if (nodeData.backgroundColor) {
      const { r, g, b, a } = nodeData.backgroundColor;
      style.backgroundColor = `rgba(${Math.round(r * 255)}, ${Math.round(
        g * 255
      )}, ${Math.round(b * 255)}, ${a})`;
    }

    // 配置の処理
    if (nodeData.layoutMode) {
      switch (nodeData.counterAxisAlignItems) {
        case "MIN":
          style.alignItems = "flex-start";
          break;
        case "CENTER":
          style.alignItems = "center";
          break;
        case "MAX":
          style.alignItems = "flex-end";
          break;
        default:
          style.alignItems = "stretch";
          break;
      }

      switch (nodeData.primaryAxisAlignItems) {
        case "MIN":
          style.justifyContent = "flex-start";
          break;
        case "CENTER":
          style.justifyContent = "center";
          break;
        case "MAX":
          style.justifyContent = "flex-end";
          break;
        case "SPACE_BETWEEN":
          style.justifyContent = "space-between";
          break;
        default:
          style.justifyContent = "flex-start";
          break;
      }

      // パディングの処理
      if (nodeData.padding) {
        if (nodeData.padding.horizontal) {
          style.paddingLeft = this.generateVariable(
            nodeData.padding.horizontal.left
          );
          style.paddingRight = this.generateVariable(
            nodeData.padding.horizontal.right
          );
        }
        if (nodeData.padding.vertical) {
          style.paddingTop = this.generateVariable(
            nodeData.padding.vertical.top
          );
          style.paddingBottom = this.generateVariable(
            nodeData.padding.vertical.bottom
          );
        }
      }

      // 間隔の処理
      if (nodeData.itemSpacing) {
        style.gap = this.generateVariable(nodeData.itemSpacing);
      }
    }

    return style;
  }

  private getAllStyles(
    componentData: ComponentData,
    parentLayout?: string
  ): Record<string, StyleProps> {
    const styles: Record<string, StyleProps> = {};
    const componentName = componentData.name.replace(/\s+/g, "").toLowerCase();

    styles[componentName] = this.convertToReactNativeStyle(
      componentData,
      parentLayout
    );

    if (componentData.children) {
      componentData.children.forEach((child) => {
        Object.assign(
          styles,
          this.getAllStyles(child, componentData.layoutMode)
        );
      });
    }

    return styles;
  }

  private toLowerFirstChar(text: string): string {
    return text.charAt(0).toLowerCase() + text.slice(1);
  }

  private generateComponentJSX(
    node: ComponentData,
    indent: string = ""
  ): string {
    const elementType = this.getElementType(node);
    const nodeName = node.name.replace(/\s+/g, "");
    const styleRef = `styles.${this.toLowerFirstChar(nodeName)}`;

    const props = `style={${styleRef}}`;

    // 子要素の処理
    let childrenJSX = "";
    if (node.children && node.children.length > 0) {
      childrenJSX = node.children
        .map((child) => {
          if (this.isComponent(child)) {
            // コンポーネントの場合は参照のみ
            const childName = child.name.replace(/\s+/g, "");
            return `${indent}  <${childName} />`;
          } else {
            // インライン要素の場合は展開
            return this.generateComponentJSX(child, indent + "  ");
          }
        })
        .join("\n");
    }

    // テキスト要素の特別処理
    if (elementType === "Text") {
      return `${indent}<Text>${node.characters || ""}</Text>`;
    }

    // 子要素の有無で出力を分岐
    if (childrenJSX) {
      return `${indent}<${elementType} ${props}>\n${childrenJSX}\n${indent}</${elementType}>`;
    } else {
      return `${indent}<${elementType} ${props} />`;
    }
  }

  private generateStyleSheet(componentData: ComponentData): string {
    const children = this.getComponentChildren(componentData).filter(
      (component) => !this.isComponent(component) && component.type !== "TEXT"
    );
    const components = [componentData, ...children];

    const componentStyleSheets = components.reduce<Record<string, object>>(
      (acc, component) => {
        const style = this.convertToReactNativeStyle(component);
        const key = this.toLowerFirstChar(component.name);
        acc[key] = style;
        return acc;
      },
      {}
    );

    return `\nconst styles = StyleSheet.create(${JSON.stringify(
      componentStyleSheets,
      null,
      2
    ).replace(/"##(.*?)##"/g, "$1")});`;
  }

  private getComponentChildren(component: ComponentData): Array<ComponentData> {
    const components: Array<ComponentData> = [];
    component.children?.forEach((child) => {
      components.push(child);
      // "DOCUMENT" | "PAGE" | "SLICE" | "FRAME" | "GROUP"
      if (
        child.type === "PAGE" ||
        child.type === "DOCUMENT" ||
        child.type === "FRAME" ||
        child.type === "GROUP" ||
        child.type === "SLICE"
      ) {
        components.push(...this.getComponentChildren(child));
      }
    });

    return components;
  }

  private getVariableNames(componentData: ComponentData): string[] {
    const variables: Set<string> = new Set();
    const getFirstPath = (name: string): string => {
      return this.toLowerFirstChar(name.split("/")[0]);
    };

    if (componentData.padding !== undefined) {
      if (componentData.padding.horizontal !== undefined) {
        if (componentData.padding.horizontal.left.variableName !== undefined) {
          variables.add(
            getFirstPath(componentData.padding.horizontal.left.variableName)
          );
        }
        if (componentData.padding.horizontal.right.variableName !== undefined) {
          variables.add(
            getFirstPath(componentData.padding.horizontal.right.variableName)
          );
        }
      }
      if (componentData.padding.vertical !== undefined) {
        if (componentData.padding.vertical.top.variableName !== undefined) {
          variables.add(
            getFirstPath(componentData.padding.vertical.top.variableName)
          );
        }
        if (componentData.padding.vertical.bottom.variableName !== undefined) {
          variables.add(
            getFirstPath(componentData.padding.vertical.bottom.variableName)
          );
        }
      }
    }
    if (componentData.itemSpacing !== undefined) {
      if (componentData.itemSpacing.variableName !== undefined) {
        variables.add(getFirstPath(componentData.itemSpacing.variableName));
      }
    }

    const children = this.getComponentChildren(componentData);
    children.forEach((child) => {
      this.getVariableNames(child).forEach((variableName) => {
        variables.add(variableName);
      });
    });

    return Array.from(variables);
  }

  public generateCode(componentData: ComponentData): string {
    const componentName = componentData.name.replace(/\s+/g, "");

    // インポートの収集
    const imports = new Set([
      "import React from 'react';",
      `import { ${this.getElementType(
        componentData
      )}, StyleSheet } from 'react-native';`,
    ]);

    // 必要なコンポーネントのインポート
    const children = this.getComponentChildren(componentData);
    children.forEach((child) => {
      if (this.isComponent(child)) {
        const childName = child.name.replace(/\s+/g, "");
        imports.add(`import { ${childName} } from './${childName}';`);
      }
    });

    // import variables
    this.getVariableNames(componentData).forEach((variableName) => {
      imports.add(`import { ${variableName} } from './${variableName}';`);
    });

    // propsインターフェースの生成
    const propsInterface = `type ${componentName}Props {
  // define props here
}`;

    return `${Array.from(imports).join("\n")}

${propsInterface}

export const ${componentName}: React.FC<${componentName}Props> = ({
  // define props here
}) => {
  return (
${this.generateComponentJSX(componentData, "    ")}
  );
};
${this.generateStyleSheet(componentData)}
`;
  }
}
