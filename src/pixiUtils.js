import * as PIXI from 'pixi.js';

export const initializePixiCanvas = (canvasWidth, canvasHeight) => {
  // create the root of the scene graph
  const renderer = PIXI.autoDetectRenderer(canvasWidth, canvasHeight);
  renderer.backgroundColor = 0xffffff;
  const stage = new PIXI.Container();
  stage.width = canvasWidth;
  stage.height = canvasHeight;
  return { renderer, stage, aspectRatio: canvasWidth / canvasHeight };
}