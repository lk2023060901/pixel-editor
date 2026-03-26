import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";

import type { ProjectedMapObject } from "./object-layer";
import type { ResolvedTileTexture } from "./tile-texture";

export interface ObjectRenderMetrics {
  tileWidth: number;
  tileHeight: number;
}

export interface ProjectedObjectSceneNodes {
  root: Container;
  sprite: Sprite | undefined;
  graphics: Graphics;
  text: Text | undefined;
  signature: string | undefined;
}

export interface ProjectedObjectTextureResolver {
  getSourceTexture: (imagePath: string) => Texture | undefined;
  getFrameTexture: (
    imagePath: string,
    frame: { x: number; y: number; width: number; height: number }
  ) => Texture | undefined;
}

export interface ProjectedObjectRenderOptions {
  tileTexture?: ResolvedTileTexture | undefined;
  textureResolver?: ProjectedObjectTextureResolver | undefined;
}

function computeMarkerSize(metrics: ObjectRenderMetrics): number {
  return Math.max(
    10,
    Math.min(metrics.tileWidth, metrics.tileHeight) * 0.42
  );
}

function computeStrokeWidth(object: ProjectedMapObject): number {
  return object.selected ? 2 : 1.4;
}

function computeStrokeColor(object: ProjectedMapObject): number {
  if (object.selected) {
    return 0x38bdf8;
  }

  return object.highlighted ? 0xf8fafc : 0x94a3b8;
}

function computeFillAlpha(object: ProjectedMapObject): number {
  return object.selected ? 0.28 : 0.16;
}

function clearProjectedObjectLabel(scene: ProjectedObjectSceneNodes): void {
  if (!scene.text) {
    return;
  }

  scene.root.removeChild(scene.text);
  scene.text.destroy();
  scene.text = undefined;
}

function clearProjectedObjectSprite(scene: ProjectedObjectSceneNodes): void {
  if (!scene.sprite) {
    return;
  }

  scene.root.removeChild(scene.sprite);
  scene.sprite.destroy();
  scene.sprite = undefined;
}

function getOrCreateProjectedObjectSprite(
  scene: ProjectedObjectSceneNodes
): Sprite {
  if (scene.sprite) {
    return scene.sprite;
  }

  const sprite = new Sprite({
    texture: Texture.EMPTY,
    roundPixels: true
  });

  scene.sprite = sprite;
  scene.root.addChildAt(sprite, 0);
  return sprite;
}

function resolveProjectedObjectTexture(
  tileTexture: ResolvedTileTexture,
  textureResolver: ProjectedObjectTextureResolver
): Texture | undefined {
  const sourceTexture = textureResolver.getSourceTexture(tileTexture.imagePath);

  if (!sourceTexture) {
    return undefined;
  }

  if (!tileTexture.frame) {
    return sourceTexture;
  }

  return textureResolver.getFrameTexture(tileTexture.imagePath, tileTexture.frame);
}

function drawProjectedTileObjectOverlay(
  graphics: Graphics,
  object: ProjectedMapObject,
  width: number,
  height: number
): void {
  const strokeWidth = computeStrokeWidth(object);
  const strokeColor = computeStrokeColor(object);

  graphics.rect(0, 0, width, height);

  if (object.selected) {
    graphics.fill({
      color: 0x38bdf8,
      alpha: computeFillAlpha(object) * Math.max(0.35, object.opacity)
    });
  }

  graphics.stroke({
    color: strokeColor,
    width: strokeWidth,
    alpha: object.selected || object.highlighted ? 1 : 0.72
  });
}

function drawProjectedObjectShape(
  graphics: Graphics,
  object: ProjectedMapObject,
  metrics: ObjectRenderMetrics
): void {
  const markerSize = computeMarkerSize(metrics);
  const strokeWidth = computeStrokeWidth(object);
  const strokeColor = computeStrokeColor(object);
  const fillAlpha = computeFillAlpha(object);

  if (object.shape === "point") {
    graphics.circle(0, 0, markerSize * 0.5);
    graphics.fill({ color: 0x38bdf8, alpha: 0.4 });
    graphics.stroke({ color: strokeColor, width: strokeWidth, alpha: 1 });
    return;
  }

  if (object.shape === "ellipse") {
    const width = Math.max(object.screenWidth, markerSize);
    const height = Math.max(object.screenHeight, markerSize);

    graphics.ellipse(width / 2, height / 2, width / 2, height / 2);
    graphics.fill({ color: 0x38bdf8, alpha: fillAlpha * object.opacity });
    graphics.stroke({ color: strokeColor, width: strokeWidth, alpha: 1 });
    return;
  }

  if (
    (object.shape === "polygon" || object.shape === "polyline") &&
    object.screenPoints?.length
  ) {
    const [firstPoint, ...remainingPoints] = object.screenPoints;

    if (!firstPoint) {
      return;
    }

    graphics.moveTo(firstPoint.x - object.screenX, firstPoint.y - object.screenY);

    for (const point of remainingPoints) {
      graphics.lineTo(point.x - object.screenX, point.y - object.screenY);
    }

    if (object.shape === "polygon") {
      graphics.closePath();
      graphics.fill({ color: 0x38bdf8, alpha: fillAlpha * object.opacity });
    }

    graphics.stroke({ color: strokeColor, width: strokeWidth, alpha: 1 });
    return;
  }

  const width = Math.max(object.screenWidth, markerSize);
  const height = Math.max(object.screenHeight, markerSize);
  const radius =
    object.shape === "capsule"
      ? Math.min(width, height) * 0.5
      : Math.min(width, height) * 0.18;
  const fillColor = object.shape === "tile" ? 0xf59e0b : 0x38bdf8;

  graphics.roundRect(0, 0, width, height, radius);
  graphics.fill({ color: fillColor, alpha: fillAlpha * object.opacity });
  graphics.stroke({ color: strokeColor, width: strokeWidth, alpha: 1 });
}

export function createProjectedObjectSceneNodes(): ProjectedObjectSceneNodes {
  const root = new Container();
  const graphics = new Graphics();

  root.addChild(graphics);

  return {
    root,
    sprite: undefined,
    graphics,
    text: undefined,
    signature: undefined
  };
}

export function destroyProjectedObjectSceneNodes(
  scene: ProjectedObjectSceneNodes
): void {
  scene.root.destroy({ children: true });
}

export function updateProjectedObjectScene(
  scene: ProjectedObjectSceneNodes,
  object: ProjectedMapObject,
  metrics: ObjectRenderMetrics,
  options: ProjectedObjectRenderOptions = {}
): void {
  scene.root.position.set(object.screenX, object.screenY);
  scene.graphics.clear();
  clearProjectedObjectLabel(scene);
  const width = Math.max(object.screenWidth, computeMarkerSize(metrics));
  const height = Math.max(object.screenHeight, computeMarkerSize(metrics));

  if (object.shape === "tile" && options.tileTexture && options.textureResolver) {
    const texture = resolveProjectedObjectTexture(
      options.tileTexture,
      options.textureResolver
    );

    if (texture) {
      const sprite = getOrCreateProjectedObjectSprite(scene);

      sprite.texture = texture;
      sprite.position.set(0, 0);
      sprite.width = width;
      sprite.height = height;
      sprite.alpha = object.opacity;
      drawProjectedTileObjectOverlay(scene.graphics, object, width, height);
      return;
    }
  }

  clearProjectedObjectSprite(scene);
  drawProjectedObjectShape(scene.graphics, object, metrics);

  if (object.shape !== "text" || !object.textContent) {
    return;
  }

  const fontSize = Math.max(1, object.textPixelSize ?? height * 0.34);
  const paddingX = Math.max(3, fontSize * 0.32);
  const paddingY = Math.max(2, fontSize * 0.24);
  const text = new Text({
    text: object.textContent,
    style: {
      fill: object.textColor ?? "#e2e8f0",
      fontSize,
      fontFamily: object.textFontFamily ?? "sans-serif",
      ...(object.textWrap
        ? {
            wordWrap: true,
            wordWrapWidth: Math.max(width - paddingX * 2, 24)
          }
        : {})
    }
  });
  text.position.set(paddingX, paddingY);
  scene.text = text;
  scene.root.addChild(text);
}

export function drawProjectedObjects(
  scene: Container,
  objects: readonly ProjectedMapObject[],
  metrics: ObjectRenderMetrics,
  options: {
    resolveTileTexture?: (object: ProjectedMapObject) => ResolvedTileTexture | undefined;
    textureResolver?: ProjectedObjectTextureResolver;
  } = {}
): void {
  for (const object of objects) {
    const objectScene = createProjectedObjectSceneNodes();

    updateProjectedObjectScene(objectScene, object, metrics, {
      tileTexture: options.resolveTileTexture?.(object),
      textureResolver: options.textureResolver
    });
    scene.addChild(objectScene.root);
  }
}
