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

export interface RunStatusResponse {
	status: RunStatus;
}
