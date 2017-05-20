import * as PIXI from 'pixi.js';

export const initializePixi = (app) => {
  PIXI.loader
    .add("cat.png")
    .load(app.createSprites);
  // create the root of the scene graph
  const width = 1200;
  const height = 600;
  const renderer = PIXI.autoDetectRenderer(width, height);
  renderer.backgroundColor = 0xffffff;
  const stage = new PIXI.Container();
  return { renderer, stage, aspectRatio: width / height };
}
