import {type Run} from './Run.js';

export type SendQueryMachineResult<TResult> = {
	run: Run;
	result: TResult;
};
