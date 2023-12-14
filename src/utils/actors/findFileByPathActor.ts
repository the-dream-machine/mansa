import {spawn} from 'xstate';
import {type ChatMachineContext} from '../../types/ChatMachine.js';
import {type FindFileByPathToolParams} from '../../types/ToolParams.js';
import {
	findFileByPathMachine,
	initialFindFileByPathContext,
} from '../../machines/findFileByPathMachine.js';

export const findFileByPathActor = (context: ChatMachineContext) => {
	const toolCall = context.toolCalls[context.currentToolCallProcessingIndex];
	if (!toolCall) {
		throw new Error('findFileByPathActor: Tool call is undefined');
	}
	const args = JSON.parse(
		toolCall.function.arguments,
	) as unknown as FindFileByPathToolParams;

	return spawn(
		findFileByPathMachine.withContext({
			...initialFindFileByPathContext,
			toolCallId: toolCall.id,
			filePath: args.file_path,
		}),
	);
};
