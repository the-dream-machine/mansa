import {spawn} from 'xstate';
import {
	initialReadFileMachineContext,
	readFileMachine,
} from '../../machines/readFileMachine.js';

import {type ChatMachineContext} from '../../types/ChatMachine.js';
import {type ReadFileToolParams} from '../../types/ToolParams.js';

export const readFileActor = (context: ChatMachineContext) => {
	const toolCall = context.toolCalls[context.currentToolCallProcessingIndex];
	if (!toolCall) {
		throw new Error('createFileToolCall: Tool call is undefined');
	}
	const args = JSON.parse(
		toolCall.function.arguments,
	) as unknown as ReadFileToolParams;

	return spawn(
		readFileMachine.withContext({
			...initialReadFileMachineContext,
			toolCallId: toolCall.id,
			filePath: args.file_path,
		}),
	);
};
