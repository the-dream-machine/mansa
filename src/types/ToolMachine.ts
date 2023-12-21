import {type ActorRef} from 'xstate';

import {type Run} from './Run.js';
import {type ToolNames, type Tool, type ToolOutput} from '../types/Tool.js';
import {type Library} from './Library.js';
import {type ToolArguments} from './ToolArguments.js';
import {type RunCommandToolMachineEvent} from '../machines/tools/runCommandToolMachine.js';
import {type SendCommandMachineEvent} from '../machines/sendCommandMachine.js';
import {type CreateFileToolMachineEvent} from '../machines/tools/createFileToolMachine.js';
import {type EditFileToolMachineEvent} from '../machines/tools/editFileToolMachine.js';
import {type UserSelectToolMachineEvent} from '../machines/tools/userSelectToolMachine.js';
import {type ReadFileToolMachineEvent} from '../machines/tools/readFileToolMachine.js';
import {type FindFileByPathToolMachineEvent} from '../machines/tools/findFileByPathToolMachine.js';
import {type UserInputToolMachineEvent} from '../machines/tools/userInputToolMachine.js';
import {type UserActionToolMachineEvent} from '../machines/tools/userActionToolMachine.js';

export type ToolActorRef = ActorRef<RunCommandToolMachineEvent>;

export type ToolStatus = 'pending' | 'active' | 'completed';

export interface ToolItem {
	id: string;
	name: ToolNames;
	type: 'function';
	status: ToolStatus;
	arguments: ToolArguments;
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface ToolRefs {
	[key: string]:
		| ActorRef<FindFileByPathToolMachineEvent>
		| ActorRef<ReadFileToolMachineEvent>
		| ActorRef<CreateFileToolMachineEvent>
		| ActorRef<EditFileToolMachineEvent>
		| ActorRef<RunCommandToolMachineEvent>
		| ActorRef<UserSelectToolMachineEvent>
		| ActorRef<UserInputToolMachineEvent>
		| ActorRef<UserActionToolMachineEvent>;
}

// Context
export interface ToolMachineContext {
	libraryName: string;
	libraryCommand: string;
	library?: Library;

	showSendCommand: boolean;
	sendCommandActorRef?: ActorRef<SendCommandMachineEvent>;

	run?: Run;
	tools: ToolItem[];
	toolRefs: ToolRefs;
	toolOutputs: ToolOutput[];

	showChat: boolean;
	isLoading: boolean;
	isError: boolean;
	errorMessage: string;
}

// States
export enum ToolState {
	FETCHING_LIBRARY = 'FETCHING_LIBRARY',
	SPAWNING_SEND_COMMAND_ACTOR = 'SPAWNING_SEND_COMMAND_ACTOR',
	SENDING_COMMAND = 'SENDING_COMMAND',

	POLLING_RUN = 'POLLING_RUN',

	ACTIVATING_PENDING_TOOL = 'ACTIVATING_PENDING_TOOL',
	SPAWNING_ACTIVE_TOOL_ACTOR = 'SPAWNING_ACTIVE_TOOL_ACTOR',
	PROCESSING_ACTIVE_TOOL = 'PROCESSING_ACTIVE_TOOL',
	SUBMITTING_TOOL_OUTPUTS = 'SUBMITTING_TOOL_OUTPUTS',

	SUCCESS_IDLE = 'SUCCESS_IDLE',
	ERROR_IDLE = 'ERROR_IDLE',
}

export type ToolMachineState =
	| {
			value: ToolState.FETCHING_LIBRARY;
			context: ToolMachineContext;
	  }
	| {
			value: ToolState.SPAWNING_SEND_COMMAND_ACTOR;
			context: ToolMachineContext;
	  }
	| {
			value: ToolState.SENDING_COMMAND;
			context: ToolMachineContext;
	  }
	| {
			value: ToolState.POLLING_RUN;
			context: ToolMachineContext;
	  }
	| {
			value: ToolState.ACTIVATING_PENDING_TOOL;
			context: ToolMachineContext;
	  }
	| {
			value: ToolState.SPAWNING_ACTIVE_TOOL_ACTOR;
			context: ToolMachineContext;
	  }
	| {
			value: ToolState.PROCESSING_ACTIVE_TOOL;
			context: ToolMachineContext;
	  }
	| {
			value: ToolState.SUBMITTING_TOOL_OUTPUTS;
			context: ToolMachineContext;
	  }
	| {
			value: ToolState.SUCCESS_IDLE;
			context: ToolMachineContext;
	  }
	| {
			value: ToolState.ERROR_IDLE;
			context: ToolMachineContext;
	  };

// Events
export enum ToolEvent {
	SEND_COMMAND_UPDATE_TOOLS = 'SEND_COMMAND_UPDATE_TOOLS',
	SUBMIT_ACTIVE_TOOL_OUTPUT = 'SUBMIT_ACTIVE_TOOL_OUTPUT',
	TOGGLE_CHAT = 'TOGGLE_CHAT',
}

export type ToolMachineEvent =
	| {
			type: ToolEvent.SEND_COMMAND_UPDATE_TOOLS;
			result: {
				run: Run;
				tools: Tool[];
			};
	  }
	| {type: ToolEvent.SUBMIT_ACTIVE_TOOL_OUTPUT; output: string}
	| {type: ToolEvent.TOGGLE_CHAT};

// Actions
export enum ToolAction {
	SET_ERROR_MESSAGE = 'SET_ERROR_MESSAGE',
}
