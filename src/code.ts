import { MessageType, PluginMessage } from "./types";
import { parseNode } from "./parser";
import { CodeGenerator } from "./codeGenerator";

figma.showUI(__html__, { width: 400, height: 500 });

const codeGenerator = new CodeGenerator();

figma.on("selectionchange", () => {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: MessageType.NO_SELECTION,
    } as PluginMessage);
    return;
  }

  const component = selection[0];
  try {
    const componentData = parseNode(component);
    const generatedCode = codeGenerator.generateCode(componentData);

    figma.ui.postMessage({
      type: MessageType.COMPONENT_DATA,
      data: {
        componentData,
        generatedCode,
      },
    } as PluginMessage);
  } catch (error) {
    figma.ui.postMessage({
      type: MessageType.ERROR,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    } as PluginMessage);
  }
});

figma.ui.onmessage = (msg: PluginMessage) => {
  if (msg.type === MessageType.CLOSE) {
    figma.closePlugin();
  }
};
