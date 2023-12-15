import {spawn} from 'xstate';
import {
	createFileMachine,
	initialCreateFileMachineContext,
} from '../../machines/createFileMachine.js';
import {type ChatMachineContext} from '../../types/ChatMachine.js';
import {type CreateFileToolParams} from '../../types/ToolParams.js';

export const createFileActor = (context: ChatMachineContext) => {
	const toolCall = context.toolCalls[context.currentToolCallProcessingIndex];
	if (!toolCall) {
		throw new Error('createFileActor: Tool call is undefined');
	}
	const args = JSON.parse(
		toolCall.function.arguments,
	) as unknown as CreateFileToolParams;

	return spawn(
		createFileMachine.withContext({
			...initialCreateFileMachineContext,
			toolCallId: toolCall.id,
			rawCode: args.file_content,
			filePath: args.file_path,
			fileExtension: 'tsx',
		}),
	);
};
