import {type ActorRef} from 'xstate';
import {type CreateFileMachineEvent} from '../machines/createFileMachine.js';
import {type ExecuteCommandMachineEvent} from '../machines/executeCommandMachine.js';
import {type ModifyFileMachineEvent} from '../machines/modifyFileMachine.js';
import {type UserActionMachineEvent} from '../machines/userActionMachine.js';
import {type Library} from './Library.js';
import {type RepoConfig} from './Repo.js';
import {type Run, type RunStatus} from './Run.js';
import {type RequiredActionFunctionToolCall, type ToolOutput} from './Tool.js';
import {type Message} from './Message.js';

export interface ChatMachineContext {
	repositoryConfig?: RepoConfig;
	commandName: string;
	libraryName: string;
	library?: Library;
	run?: Run;
	isRetrievalRun: boolean;
	retrievalRun?: Run;
	retrievalContext: string;
	messages: Message[];
	toolCalls: RequiredActionFunctionToolCall[];
	currentToolCallProcessingIndex: number;
	toolOutputs: ToolOutput[];
	query: string;
	status?: RunStatus;
	activeToolActor?:
		| ActorRef<CreateFileMachineEvent>
		| ActorRef<ModifyFileMachineEvent>
		| ActorRef<ExecuteCommandMachineEvent>
		| ActorRef<UserActionMachineEvent>;

	// Component states
	enterLabel: string;
	enterDisabled: boolean;
	isLoading: boolean;
	loadingMessage: string;
	isWorking: boolean;
	isSuccess: boolean;
	isError: boolean;
	errorMessage?: string;
}

export enum ChatEvent {
	ENTER_KEY_PRESS = 'ENTER_KEY_PRESS',
	SEND_QUERY = 'SEND_QUERY',
	ADD_MESSAGE = 'ADD_MESSAGE',
}

export type ChatMachineEvent =
	| {type: ChatEvent.ENTER_KEY_PRESS}
	| {type: ChatEvent.SEND_QUERY; query: string}
	| {type: ChatEvent.ADD_MESSAGE; message: Message};
