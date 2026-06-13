import { Game } from './engine/game.js';
import { Input } from './engine/input.js';
import { CanvasRenderer } from './engine/renderer.js';
import { MenuScene } from './game/scenes/MenuScene.js';

const canvas = document.getElementById('game');
const renderer = new CanvasRenderer(canvas);
const input = new Input(window);

const game = new Game({ renderer, input });

game.replaceScene(new MenuScene());

game.start();
