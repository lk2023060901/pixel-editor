import { Container, Graphics, Text } from "pixi.js";

import type { ProjectedMapObject } from "./object-layer";

export interface ObjectRenderMetrics {
  tileWidth: number;
  tileHeight: number;
}

export function drawProjectedObjects(
  scene: Container,
  objects: readonly ProjectedMapObject[],
  metrics: ObjectRenderMetrics
): void {
  for (const object of objects) {
    const graphics = new Graphics();
    const markerSize = Math.max(
      10,
      Math.min(metrics.tileWidth, metrics.tileHeight) * 0.42
    );
    const strokeWidth = object.selected ? 2 : 1.4;
    const strokeColor = object.selected
      ? 0x38bdf8
      : object.highlighted
        ? 0xf8fafc
        : 0x94a3b8;
    const fillAlpha = object.selected ? 0.28 : 0.16;

    if (object.shape === "point") {
      graphics.circle(object.screenX, object.screenY, markerSize * 0.5);
      graphics.fill({ color: 0x38bdf8, alpha: 0.4 });
      graphics.stroke({ color: strokeColor, width: strokeWidth, alpha: 1 });
      scene.addChild(graphics);
      continue;
    }

    if (object.shape === "ellipse") {
      const width = Math.max(object.screenWidth, markerSize);
      const height = Math.max(object.screenHeight, markerSize);

      graphics.ellipse(
        object.screenX + width / 2,
        object.screenY + height / 2,
        width / 2,
        height / 2
      );
      graphics.fill({ color: 0x38bdf8, alpha: fillAlpha * object.opacity });
      graphics.stroke({ color: strokeColor, width: strokeWidth, alpha: 1 });
      scene.addChild(graphics);
      continue;
    }

    if (
      (object.shape === "polygon" || object.shape === "polyline") &&
      object.screenPoints?.length
    ) {
      const [firstPoint, ...remainingPoints] = object.screenPoints;

      if (firstPoint) {
        graphics.moveTo(firstPoint.x, firstPoint.y);

        for (const point of remainingPoints) {
          graphics.lineTo(point.x, point.y);
        }

        if (object.shape === "polygon") {
          graphics.closePath();
          graphics.fill({ color: 0x38bdf8, alpha: fillAlpha * object.opacity });
        }

        graphics.stroke({ color: strokeColor, width: strokeWidth, alpha: 1 });
      }

      scene.addChild(graphics);
      continue;
    }

    const width = Math.max(object.screenWidth, markerSize);
    const height = Math.max(object.screenHeight, markerSize);
    const radius =
      object.shape === "capsule"
        ? Math.min(width, height) * 0.5
        : Math.min(width, height) * 0.18;
    const fillColor = object.shape === "tile" ? 0xf59e0b : 0x38bdf8;

    graphics.roundRect(object.screenX, object.screenY, width, height, radius);
    graphics.fill({ color: fillColor, alpha: fillAlpha * object.opacity });
    graphics.stroke({ color: strokeColor, width: strokeWidth, alpha: 1 });
    scene.addChild(graphics);

    if (object.shape === "text" && object.textContent) {
      const text = new Text({
        text: object.textContent,
        style: {
          fill: 0xe2e8f0,
          fontSize: Math.max(12, height * 0.34),
          fontFamily: "IBM Plex Sans, sans-serif",
          wordWrap: true,
          wordWrapWidth: Math.max(width - 10, 40)
        }
      });
      text.position.set(object.screenX + 6, object.screenY + 4);
      scene.addChild(text);
    }
  }
}
