import {type QueryMachineContext} from '../machines/sendQueryMachine.js';

export const initialSendQueryMachineContext: QueryMachineContext = {
	query: '',
	systemInstructions: '',
	responseParentKey: '',
	run: {thread_id: '', run_id: ''},
	errorMessage: '',
	result: '',
};
