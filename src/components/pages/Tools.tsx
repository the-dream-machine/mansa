import {Box, Text} from 'ink';
import React, {Fragment} from 'react';
import {ToolsContext} from '../ToolsProvider.js';
import {Header} from '../Header.js';
import {PageContainer} from '../PageContainer.js';
import {ToolState} from '../../types/ToolMachine.js';
import {RunCommandTool} from '../tools/RunCommandTool.js';
import {UserInputTool} from '../tools/UserInputTool.js';
import {CreateFileTool} from '../tools/CreateFileTool.js';
import {EditFileTool} from '../tools/EditFileTool.js';
import {UserSelectTool} from '../tools/UserSelectTool.js';
import {ReadFileTool} from '../tools/ReadFileTool.js';
import {FindFileByPathTool} from '../tools/FindFileByPathTool.js';
import {SendCommand} from './SendCommand.js';
import {Spinner} from '@inkjs/ui';
import {Colors} from '../../styles/Colors.js';
import {UserActionTool} from '../tools/UserActionTool.js';

export const Tools = () => {
	const [state] = ToolsContext.useActor();

	const library = state.context.library;
	const showSendCommand = state.context.showSendCommand;
	const isLoading = state.context.isLoading;
	const isError = state.context.isError;
	const errorMessage = state.context.errorMessage;
	const tools = state.context.tools;
	const completedTools = tools.filter(tool => tool.status === 'completed');
	const activeTool = tools.filter(tool => tool.status === 'active')[0];

	return (
		<PageContainer>
			<Header
				title={library?.name}
				backgroundColor={library?.backgroundColor}
				textColor={library?.textColor}
			/>
			{showSendCommand && <SendCommand />}

			{completedTools.map(tool => (
				<Fragment key={tool.id}>
					{tool.name === 'find_file_by_path' && (
						<FindFileByPathTool id={tool.id} />
					)}
					{tool.name === 'read_file' && <ReadFileTool id={tool.id} />}
					{tool.name === 'create_file' && <CreateFileTool id={tool.id} />}
					{tool.name === 'edit_file' && <EditFileTool id={tool.id} />}
					{tool.name === 'run_command' && <RunCommandTool id={tool.id} />}
					{tool.name === 'user_input' && <UserInputTool id={tool.id} />}
					{tool.name === 'user_select' && <UserSelectTool id={tool.id} />}
					{tool.name === 'user_action' && <UserActionTool id={tool.id} />}
				</Fragment>
			))}

			{state.matches(ToolState.PROCESSING_ACTIVE_TOOL) && activeTool && (
				<>
					{activeTool.name === 'find_file_by_path' && (
						<FindFileByPathTool id={activeTool.id} />
					)}
					{activeTool.name === 'read_file' && (
						<ReadFileTool id={activeTool.id} />
					)}
					{activeTool.name === 'create_file' && (
						<CreateFileTool id={activeTool.id} />
					)}
					{activeTool.name === 'edit_file' && (
						<EditFileTool id={activeTool.id} />
					)}
					{activeTool.name === 'run_command' && (
						<RunCommandTool id={activeTool.id} />
					)}
					{activeTool.name === 'user_input' && (
						<UserInputTool id={activeTool.id} />
					)}
					{activeTool.name === 'user_select' && (
						<UserSelectTool id={activeTool.id} />
					)}
					{activeTool.name === 'user_action' && (
						<UserActionTool id={activeTool.id} />
					)}
				</>
			)}

			{isLoading && (
				<Box gap={1} marginY={1} paddingX={3}>
					<Spinner />
					<Text>Loading next step</Text>
				</Box>
			)}
			{isError && (
				<Box gap={1} marginY={1} paddingX={3}>
					<Text color={Colors.LightGray}>
						<Text color={Colors.LightRed}>Error: </Text>Error {errorMessage}
					</Text>
				</Box>
			)}
			{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
			{/* @ts-ignore */}
			{/* <Text>State: {state.value}</Text> */}
		</PageContainer>
	);
};
