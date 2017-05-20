import * as PIXI from 'pixi.js';

export const initializePixi = (app) => {
  PIXI.loader
    .add("cat.png")
    .load(app.createSprites);
  // create the root of the scene graph
  const renderer = PIXI.autoDetectRenderer(1200, 600);
  renderer.backgroundColor = 0xffffff;
  const stage = new PIXI.Container();
  return { renderer, stage };
}
