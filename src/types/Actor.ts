import type {
	BaseActionObject,
	EventObject,
	ResolveTypegenMeta,
	Sender,
	ServiceMap,
	State,
	TypegenDisabled,
	Typestate,
} from 'xstate';
import type {CreateFileMachineEvent} from '../machines/createFileMachine.js';

export type Actor<
	TMachineContext,
	TMachineEvent extends EventObject,
	TMachineState extends Typestate<TMachineContext>,
> = [
	State<
		TMachineContext,
		TMachineEvent,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		any,
		TMachineState,
		ResolveTypegenMeta<
			TypegenDisabled,
			TMachineEvent,
			BaseActionObject,
			ServiceMap
		>
	>,
	Sender<CreateFileMachineEvent>,
];
