import {type Sender, createMachine} from 'xstate';

import {type NavigationMachineEvent} from './navigationMachine.js';

export enum StepType {
	RUN_BASH_COMMAND = 'RUN_BASH_COMMAND',
	CREATE_FILE = 'CREATE_FILE',
	MODIFY_FILE = 'MODIFY_FILE',
}

export interface Step {
	id: string;
	step_title: string;
	step_description: string;
	step_type: keyof typeof StepType;
	new_file_paths_to_create?: {
		file_path: string;
		file_content_summary: string;
	}[];
	existing_file_paths_to_modify?: {
		file_path: string;
		file_modification_summary: string;
	}[];
	bash_command_to_run?: string;
}

// Context
interface StepsMachineContext {
	steps: Step[];
	activeStepId: string;
	navigate?: Sender<NavigationMachineEvent>;
}

// States
export enum StepsState {
	GENERATING_STEPS = 'GENERATING_STEPS',
	ACTIVE_STEP_IDLE = 'ACTIVE_STEP_IDLE',
}

//  State machine states
type StepsMachineState =
	| {value: StepsState.GENERATING_STEPS; context: StepsMachineContext}
	| {value: StepsState.ACTIVE_STEP_IDLE; context: StepsMachineContext};

export enum StepsEvent {
	ENTER_PRESSED = 'ENTER_PRESSED',
}

//  State machine events
type StepsMachineEvent = {type: StepsEvent.ENTER_PRESSED};

// Guards

export const StepsMachine = createMachine<
	StepsMachineContext,
	StepsMachineEvent,
	StepsMachineState
>({
	id: 'stepsMachine',
	predictableActionArguments: true,
	initial: StepsState.GENERATING_STEPS,
	context: {
		steps: [],
		activeStepId: '',
	},
	states: {
		[StepsState.GENERATING_STEPS]: {},
	},
});
