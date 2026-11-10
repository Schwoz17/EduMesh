// Runs the in-browser model off the main thread so the page stays responsive.
import { WebWorkerMLCEngineHandler } from '../vendor/web-llm/index.js';

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
