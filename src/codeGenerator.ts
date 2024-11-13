import { ComponentData } from "./types";

interface StyleProps {
  flex?: number;
  width?: number | string;
  height?: number | string;
  backgroundColor?: string;
  flexDirection?: "row" | "column";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between";
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  gap?: number;
  flexWrap?: "wrap" | "nowrap";
  margin?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

interface DimensionVariable {
  name: string;
  value: number;
  variableName?: string;
}

export class CodeGenerator {
  private variables: Set<DimensionVariable> = new Set();

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

  private formatVariableName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  }

  private isDimensionVariable(value: number): {
    isVariable: boolean;
    name?: string;
  } {
    const commonDimensions = [16, 24, 32, 48, 64, 320, 360];
    if (commonDimensions.includes(value)) {
      return {
        isVariable: true,
        name: `dimension_${value}`,
      };
    }
    return { isVariable: false };
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
    if (nodeData.width) {
      const widthVar = this.isDimensionVariable(nodeData.width);
      if (widthVar.isVariable && widthVar.name) {
        this.variables.add({
          name: widthVar.name,
          value: nodeData.width,
        });
        style.width = `dimensions.${widthVar.name}`;
      } else if (nodeData.layoutMode) {
        style.flex = 1;
      } else {
        style.width = nodeData.width;
      }
    }

    if (nodeData.height) {
      const heightVar = this.isDimensionVariable(nodeData.height);
      if (heightVar.isVariable && heightVar.name) {
        this.variables.add({
          name: heightVar.name,
          value: nodeData.height,
        });
        style.height = `dimensions.${heightVar.name}`;
      } else {
        style.height = nodeData.height;
      }
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
      }

      // パディングの処理
      if (nodeData.padding) {
        if (nodeData.padding.horizontal) {
          style.paddingLeft = nodeData.padding.horizontal.left;
          style.paddingRight = nodeData.padding.horizontal.right;
        }
        if (nodeData.padding.vertical) {
          style.paddingTop = nodeData.padding.vertical.top;
          style.paddingBottom = nodeData.padding.vertical.bottom;
        }
      }

      // 間隔の処理
      if (nodeData.itemSpacing) {
        style.gap = nodeData.itemSpacing;
      }
    }

    return style;
  }

  // private generateComponentJSX(
  //   node: ComponentData,
  //   parentLayout?: string,
  //   indent: string = ""
  // ): string {
  //   const elementType = this.getElementType(node);
  //   const nodeName = node.name.replace(/\s+/g, "");

  //   // スタイルの参照
  //   const styleRef = `styles.${nodeName.toLowerCase()}`;

  //   // 子要素の処理
  //   let childrenJSX = "";
  //   if (node.children && node.children.length > 0) {
  //     childrenJSX = node.children
  //       .map((child) => {
  //         if (this.isComponent(child)) {
  //           // コンポーネント化されているものはインポートして使用
  //           const childName = child.name.replace(/\s+/g, "");
  //           return `${indent}  <${childName} />`;
  //         } else {
  //           // コンポーネント化されていないものはインライン展開
  //           return this.generateComponentJSX(
  //             child,
  //             node.layoutMode,
  //             indent + "  "
  //           );
  //         }
  //       })
  //       .join("\n");
  //   }

  //   // テキスト要素の場合
  //   if (elementType === "Text") {
  //     return `${indent}<Text style={${styleRef}}>${
  //       node.characters || ""
  //     }</Text>`;
  //   }

  //   // 子要素がある場合とない場合で分岐
  //   if (childrenJSX) {
  //     return `${indent}<${elementType} style={${styleRef}}>\n${childrenJSX}\n${indent}</${elementType}>`;
  //   } else {
  //     return `${indent}<${elementType} style={${styleRef}} />`;
  //   }
  // }

  //   private generateComponentCode(
  //     componentData: ComponentData,
  //     parentLayout?: string
  //   ): string {
  //     const componentName = componentData.name.replace(/\s+/g, "");

  //     // インポートの収集
  //     const imports = new Set([
  //       "import React from 'react';",
  //       `import { ${this.getElementType(componentData)} } from 'react-native';`,
  //     ]);

  //     // 子コンポーネントのインポート
  //     if (componentData.children) {
  //       componentData.children.forEach((child) => {
  //         if (this.isComponent(child)) {
  //           const childName = child.name.replace(/\s+/g, "");
  //           imports.add(`import { ${childName} } from './${childName}';`);
  //         } else {
  //           imports.add(
  //             `import { ${this.getElementType(child)} } from 'react-native';`
  //           );
  //         }
  //       });
  //     }

  //     // 変数のインポート
  //     if (this.variables.size > 0) {
  //       imports.add("import { dimensions } from '../styles/dimensions';");
  //     }

  //     // コンポーネントコードの生成
  //     return `${Array.from(imports).join("\n")}

  // interface ${componentName}Props {
  //   // TODO: Add props as needed
  // }

  // export const ${componentName}: React.FC<${componentName}Props> = () => {
  //   return (
  // ${this.generateComponentJSX(componentData, parentLayout, "    ")}
  //   );
  // };
  // `;
  //   }

  // private generateImports(componentData: ComponentData): string[] {
  //   const requiredComponents = new Set<string>([]);
  //   const collectComponentTypes = (node: ComponentData) => {
  //     requiredComponents.add(this.getElementType(node));
  //     if (node.children) {
  //       node.children.forEach(collectComponentTypes);
  //     }
  //   };
  //   collectComponentTypes(componentData);

  //   const imports = [
  //     "import React from 'react';",
  //     `import { ${Array.from(requiredComponents).join(
  //       ", "
  //     )}, StyleSheet } from 'react-native';`,
  //   ];

  //   if (this.variables.size > 0) {
  //     imports.push("import { dimensions } from '../styles/dimensions';");
  //   }

  //   return imports;
  // }

  //   private generateDimensionsFile(): string {
  //     if (this.variables.size === 0) return "";

  //     const variables = Array.from(this.variables).reduce(
  //       (acc, { name, value }) => {
  //         acc[name] = value;
  //         return acc;
  //       },
  //       {} as Record<string, number>
  //     );

  //     return `// Auto-generated dimension variables from Figma
  // export const dimensions = ${JSON.stringify(variables, null, 2)
  //       .replace(/"([^"]+)":/g, "$1:")
  //       .replace(/"/g, "'")};
  // `;
  //   }

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

  //   public generateCode(componentData: ComponentData): string {
  //     this.variables.clear();
  //     const componentName = componentData.name.replace(/\s+/g, "");

  //     // インポートの収集
  //     const imports = new Set([
  //       "import React from 'react';",
  //       `import { ${this.getElementType(
  //         componentData
  //       )}, StyleSheet } from 'react-native';`,
  //     ]);

  //     // 子コンポーネントのインポート
  //     if (componentData.children) {
  //       componentData.children.forEach((child) => {
  //         if (this.isComponent(child)) {
  //           const childName = child.name.replace(/\s+/g, "");
  //           imports.add(`import { ${childName} } from './${childName}';`);
  //         } else {
  //           const elementType = this.getElementType(child);
  //           if (!imports.has(`'react-native'`)) {
  //             imports.add(`import { ${elementType} } from 'react-native';`);
  //           }
  //         }
  //       });
  //     }

  //     // 変数のインポート（存在する場合）
  //     if (this.variables.size > 0) {
  //       imports.add("import { dimensions } from '../styles/dimensions';");
  //     }

  //     // コンポーネントコード生成
  //     const componentJSX = this.generateComponentJSX(componentData);

  //     // スタイル生成
  //     const styles = this.getAllStyles(componentData);
  //     const styleSheet = `\nconst styles = StyleSheet.create(${JSON.stringify(
  //       styles,
  //       null,
  //       2
  //     )
  //       .replace(/"([^"]+)":/g, "$1:")
  //       .replace(/"/g, "'")});`;

  //     // 最終的なコードを組み立て
  //     return `${Array.from(imports).join("\n")}

  // interface ${componentName}Props {
  //   // TODO: Add props as needed
  // }

  // export const ${componentName}: React.FC<${componentName}Props> = () => {
  //   return (
  // ${componentJSX}
  //   );
  // };
  // ${styleSheet}
  // `;
  //   }

  private generateComponentProps(componentData: ComponentData): string[] {
    const props: string[] = [];

    // Figmaの設定に基づいてpropsを生成
    if (componentData.type === "TEXT") {
      props.push("text?: string");
    }

    if ("opacity" in componentData) {
      props.push("opacity?: number");
    }

    // インスタンスの場合、コンポーネントのプロパティを反映
    if (componentData.type === "INSTANCE") {
      // プロパティの設定があれば反映
      // overriddenProperties などを使用
    }

    // デフォルトのprops
    props.push("style?: StyleProp<ViewStyle>");
    props.push("children?: React.ReactNode");

    return props;
  }

  private generateComponentJSX(
    node: ComponentData,
    indent: string = ""
  ): string {
    const elementType = this.getElementType(node);
    const nodeName = node.name.replace(/\s+/g, "");
    const styleRef = `styles.${nodeName.toLowerCase()}`;

    let props = `style={${styleRef}}`;

    // コンポーネント固有のpropsを追加
    if (elementType === "Text" && node.characters) {
      props += ` numberOfLines={1}`; // テキストが設定されている場合の例
    }
    if ("opacity" in node) {
      props += ` opacity={${node.opacity}}`;
    }

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
      return `${indent}<Text ${props}>${node.characters || ""}</Text>`;
    }

    // 子要素の有無で出力を分岐
    if (childrenJSX) {
      return `${indent}<${elementType} ${props}>\n${childrenJSX}\n${indent}</${elementType}>`;
    } else {
      return `${indent}<${elementType} ${props} />`;
    }
  }

  public generateCode(componentData: ComponentData): string {
    this.variables.clear();
    const componentName = componentData.name.replace(/\s+/g, "");

    // インポートの収集
    const imports = new Set([
      "import React from 'react';",
      `import { ${this.getElementType(
        componentData
      )}, StyleSheet, StyleProp, ViewStyle } from 'react-native';`,
    ]);

    // 必要なコンポーネントのインポート
    if (componentData.children) {
      componentData.children.forEach((child) => {
        if (this.isComponent(child)) {
          const childName = child.name.replace(/\s+/g, "");
          imports.add(`import { ${childName} } from './${childName}';`);
        } else {
          const elementType = this.getElementType(child);
          if (!imports.has(`'react-native'`)) {
            imports.add(`import { ${elementType} } from 'react-native';`);
          }
        }
      });
    }

    // 変数のインポート
    if (this.variables.size > 0) {
      imports.add("import { dimensions } from '../styles/dimensions';");
    }

    // このコンポーネントのスタイルのみを生成
    const style = this.convertToReactNativeStyle(componentData);
    const styleSheet = `\nconst styles = StyleSheet.create({
  ${componentName.toLowerCase()}: ${JSON.stringify(style, null, 2)
      .replace(/"([^"]+)":/g, "$1:")
      .replace(/"/g, "'")}
});`;

    // propsインターフェースの生成
    const propsInterface = `interface ${componentName}Props {
  ${this.generateComponentProps(componentData).join(";\n  ")};
}`;

    return `${Array.from(imports).join("\n")}

${propsInterface}

export const ${componentName}: React.FC<${componentName}Props> = ({
  style,
  children,
  ...props
}) => {
  return (
${this.generateComponentJSX(componentData, "    ")}
  );
};
${styleSheet}
`;
  }
}
