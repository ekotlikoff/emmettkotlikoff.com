import * as PIXI from 'pixi.js';

export const initializePixi = (spritesCreatedCallback) => {
  // create the root of the scene graph
  const width = 1200;
  const height = 600;
  const renderer = PIXI.autoDetectRenderer(width, height);
  renderer.backgroundColor = 0xffffff;
  const stage = new PIXI.Container();
  return { renderer, stage, aspectRatio: width / height };
}

export const initializePixiCanvas = (app, canvasWidth, canvasHeight) => {
  // create the root of the scene graph
  const renderer = PIXI.autoDetectRenderer(canvasWidth, canvasHeight);
  renderer.backgroundColor = 0xffffff;
  const stage = new PIXI.Container();
  stage.width = canvasWidth;
  stage.height = canvasHeight;
  return { renderer, stage, aspectRatio: canvasWidth / canvasHeight };
}