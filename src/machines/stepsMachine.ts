import {type Sender, createMachine, assign, type DoneInvokeEvent} from 'xstate';

import {generateSteps} from '../utils/api/generateSteps.js';
import {type NavigationMachineEvent} from './navigationMachine.js';
import type {Step} from '../types/Step.js';
import {sleep} from 'zx';

// Context
export interface StepsMachineContext {
	steps?: Step[];
	activeStepIndex: number;
	navigate?: Sender<NavigationMachineEvent>;
}

// States
export enum StepsState {
	GENERATING_STEPS = 'GENERATING_STEPS',
	ACTIVE_STEP_IDLE = 'ACTIVE_STEP_IDLE',
	ACTIVE_STEP_RUNNING = 'ACTIVE_STEP_RUNNING',
	ACTIVE_STEP_SUCCESS_IDLE = 'ACTIVE_STEP_SUCCESS_IDLE',
	ACTIVE_STEP_ERROR_IDLE = 'ACTIVE_STEP_ERROR_IDLE',
}

//  State machine states
type StepsMachineState =
	| {value: StepsState.GENERATING_STEPS; context: StepsMachineContext}
	| {value: StepsState.ACTIVE_STEP_IDLE; context: StepsMachineContext}
	| {value: StepsState.ACTIVE_STEP_RUNNING; context: StepsMachineContext}
	| {value: StepsState.ACTIVE_STEP_SUCCESS_IDLE; context: StepsMachineContext}
	| {value: StepsState.ACTIVE_STEP_ERROR_IDLE; context: StepsMachineContext};

export enum StepsEvent {
	ENTER_PRESSED = 'ENTER_PRESSED',
}

//  State machine events
type StepsMachineEvent = {type: StepsEvent.ENTER_PRESSED};

// Guards

export const stepsMachine = createMachine<
	StepsMachineContext,
	StepsMachineEvent,
	StepsMachineState
>({
	id: 'stepsMachine',
	predictableActionArguments: true,
	initial: StepsState.GENERATING_STEPS,
	context: {
		steps: [],
		activeStepIndex: 1,
	},
	states: {
		[StepsState.GENERATING_STEPS]: {
			invoke: {
				src: async () => await generateSteps(),
				onDone: {
					target: StepsState.ACTIVE_STEP_IDLE,
					actions: assign({
						steps: (_, event: DoneInvokeEvent<Step[]>) => event.data,
					}),
				},
				onError: {
					actions: (_, event: DoneInvokeEvent<Error>) =>
						console.log('generate steps error: ', event.data),
				},
			},
		},

		[StepsState.ACTIVE_STEP_IDLE]: {
			on: {
				[StepsEvent.ENTER_PRESSED]: {
					target: StepsState.ACTIVE_STEP_RUNNING,
				},
			},
		},
		[StepsState.ACTIVE_STEP_RUNNING]: {
			invoke: {
				src: async () => await sleep(4000),
				onDone: {
					target: StepsState.ACTIVE_STEP_SUCCESS_IDLE,
				},
			},
		},
		[StepsState.ACTIVE_STEP_SUCCESS_IDLE]: {
			on: {
				[StepsEvent.ENTER_PRESSED]: {
					target: StepsState.ACTIVE_STEP_IDLE,
					actions: assign({
						activeStepIndex: context => context.activeStepIndex + 1,
					}),

					// actions:() =>{}
				},
			},
		},
		[StepsState.ACTIVE_STEP_ERROR_IDLE]: {},
	},
});
