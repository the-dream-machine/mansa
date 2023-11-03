import {$} from 'zx';

export const chromaIsInstalled = async () => await $`chroma --help`.quiet();
