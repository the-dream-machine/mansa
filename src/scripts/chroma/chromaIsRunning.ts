import {chroma} from '../../utils/chroma.js';

export const chromaIsRunning = async () => await chroma.heartbeat();
