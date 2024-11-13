export enum MessageType {
  NO_SELECTION = "no-selection",
  COMPONENT_DATA = "component-data",
  ERROR = "error",
  CLOSE = "close",
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Padding {
  horizontal?: {
    left: number;
    right: number;
  };
  vertical?: {
    top: number;
    bottom: number;
  };
}

// FigmaのNodeType定義
export type NodeType =
  | "DOCUMENT"
  | "PAGE"
  | "FRAME"
  | "GROUP"
  | "COMPONENT"
  | "COMPONENT_SET"
  | "INSTANCE"
  | "BOOLEAN_OPERATION"
  | "VECTOR"
  | "STAR"
  | "LINE"
  | "ELLIPSE"
  | "POLYGON"
  | "RECTANGLE"
  | "TEXT";

export interface ComponentData {
  name: string;
  type: NodeType;
  width?: number;
  height?: number;
  layoutMode?: "HORIZONTAL" | "VERTICAL";
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX";
  padding?: Padding;
  itemSpacing?: number;
  backgroundColor?: Color;
  children?: ComponentData[];
  // テキストノード用のプロパティ
  characters?: string;
  fontSize?: number;
  fontName?: {
    family: string;
    style: string;
  };
  textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  textAlignVertical?: "TOP" | "CENTER" | "BOTTOM";
  textCase?: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE";
  textDecoration?: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
  letterSpacing?: number;
  lineHeight?:
    | number
    | {
        value: number;
        unit: "PIXELS" | "PERCENT";
      };
  // レイアウト関連のプロパティ
  constrainProportions?: boolean;
  layoutAlign?: "STRETCH" | "INHERIT";
  layoutGrow?: number;
  // スタイル関連のプロパティ
  opacity?: number;
  blendMode?:
    | "PASS_THROUGH"
    | "NORMAL"
    | "MULTIPLY"
    | "SCREEN"
    | "OVERLAY"
    | "DARKEN"
    | "LIGHTEN";
  effects?: Array<{
    type: "INNER_SHADOW" | "DROP_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
    color?: Color;
    offset?: { x: number; y: number };
    radius?: number;
    spread?: number;
    visible?: boolean;
  }>;
  cornerRadius?:
    | number
    | {
        topLeft: number;
        topRight: number;
        bottomRight: number;
        bottomLeft: number;
      };
}

export interface PluginMessage {
  type: MessageType;
  data?: {
    componentData: ComponentData;
    generatedCode: string;
  };
  error?: string;
}
