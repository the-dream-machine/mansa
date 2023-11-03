import {path} from 'zx';
import {fishcakePath} from './userPath.js';

export const modelOutputDirectory = `${fishcakePath}/models/Xenova/bge-base-en-v1.5/onnx/`;
export const modelOutputFilename = 'model.onnx';
export const modelOutputFullPath = path.join(
	modelOutputDirectory,
	modelOutputFilename,
);
