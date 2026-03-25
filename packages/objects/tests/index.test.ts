import { describe, expect, it } from "vitest";

import { CommandHistory } from "@pixel-editor/command-engine";
import {
  createMapObject,
  createProject
} from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";
import { createMapDocumentCommand } from "@pixel-editor/map";

import {
  addObjectCommand,
  moveObjectsCommand,
  pasteObjectClipboardCommand,
  removeSelectedObjectsCommand,
  selectObjectCommand
} from "../src/index";

describe("object commands", () => {
  it("adds, selects, pastes, and removes objects through object-specific commands", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(
      createMapDocumentCommand({
        name: "map-1",
        orientation: "orthogonal",
        width: 20,
        height: 12,
        tileWidth: 32,
        tileHeight: 32
      })
    );

    const map = history.state.maps[0]!;
    const objectLayer = map.layers.find((layer) => layer.kind === "object")!;
    const object = createMapObject({
      name: "Object 1",
      shape: "rectangle",
      x: 32,
      y: 64,
      width: 32,
      height: 16
    });

    history.execute(addObjectCommand(map.id, objectLayer.id, object));
    history.execute(selectObjectCommand(object.id));

    const afterAddLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");

    expect(afterAddLayer?.kind === "object" ? afterAddLayer.objects : []).toHaveLength(1);
    expect(history.state.session.selection).toEqual({
      kind: "object",
      objectIds: [object.id]
    });

    history.execute(
      pasteObjectClipboardCommand(map.id, objectLayer.id, 64, 96, [object], {
        x: 32,
        y: 64,
        width: 32,
        height: 16
      })
    );

    const afterPasteLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");

    expect(afterPasteLayer?.kind === "object" ? afterPasteLayer.objects : []).toHaveLength(2);
    expect(
      afterPasteLayer?.kind === "object" ? afterPasteLayer.objects[1] : undefined
    ).toMatchObject({
      x: 64,
      y: 96,
      width: 32,
      height: 16
    });

    history.execute(moveObjectsCommand(map.id, objectLayer.id, [object.id], 16, -8));

    const afterMoveLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");

    expect(afterMoveLayer?.kind === "object" ? afterMoveLayer.objects[0] : undefined).toMatchObject({
      x: 48,
      y: 56,
      width: 32,
      height: 16
    });

    history.execute(
      removeSelectedObjectsCommand(map.id, objectLayer.id, history.state.session.selection)
    );

    const afterRemoveLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");

    expect(afterRemoveLayer?.kind === "object" ? afterRemoveLayer.objects : []).toHaveLength(1);
    expect(history.state.session.selection).toEqual({ kind: "none" });
  });
});
