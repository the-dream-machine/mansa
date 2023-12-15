import {spawn} from 'xstate';
import {type ChatMachineContext} from '../../types/ChatMachine.js';
import {type EditFileToolParams} from '../../types/ToolParams.js';
import {
	editFileMachine,
	initialEditFileMachineContext,
} from '../../machines/editFileMachine.js';

export const editFileActor = (context: ChatMachineContext) => {
	const toolCall = context.toolCalls[context.currentToolCallProcessingIndex];
	console.log('🌱 # toolCall:', toolCall);
	if (!toolCall) {
		throw new Error('editFileActor: Tool call is undefined');
	}
	const args = JSON.parse(
		toolCall.function.arguments,
	) as unknown as EditFileToolParams;
	console.log('🌱 # args:', args);

	return spawn(
		editFileMachine.withContext({
			...initialEditFileMachineContext,
			toolCallId: toolCall.id,
			fileContent: args.file_content,
			filePath: args.file_path,
			fileExtension: 'json',
		}),
	);
};
