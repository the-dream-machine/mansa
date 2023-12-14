import {spawn} from 'xstate';
import {type ChatMachineContext} from '../../types/ChatMachine.js';
import {
	getRepositorySummaryMachine,
	initialGetRepositorySummaryContext,
} from '../../machines/getRepositorySummaryMachine.js';

export const getRepositorySummaryActor = (context: ChatMachineContext) => {
	const toolCall = context.toolCalls[context.currentToolCallProcessingIndex];
	if (!toolCall) {
		throw new Error('getRepositorySummaryActor: Tool call is undefined');
	}

	return spawn(
		getRepositorySummaryMachine.withContext({
			...initialGetRepositorySummaryContext,
			toolCallId: toolCall.id,
		}),
	);
};
