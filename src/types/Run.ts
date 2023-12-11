import {type SubmitToolOutputs} from './Tool.js';

export interface Run {
	thread_id: string;
	run_id: string;
}

export type RunStatus =
	| 'queued'
	| 'in_progress'
	| 'requires_action'
	| 'cancelling'
	| 'cancelled'
	| 'failed'
	| 'completed'
	| 'expired';

export interface RunRequiredAction {
	type: 'submit_tool_outputs';
	submit_tool_outputs: SubmitToolOutputs;
}

export interface RunStatusResponse {
	status: RunStatus;
	required_action: RunRequiredAction;
}
