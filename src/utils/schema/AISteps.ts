import {Type} from '@sinclair/typebox';
import {StepType} from '../../types/Step.js';

export const generateStepsBodySchema = Type.Object({
	codebaseMap: Type.Array(
		Type.Object({
			filePath: Type.String(),
			fileSummary: Type.String(),
		}),
	),
	dependencies: Type.Record(Type.String(), Type.String()),
	devDependencies: Type.Record(Type.String(), Type.String()),
	question: Type.String(),
});

export const AIStepsResponseSchema = Type.Array(
	Type.Object({
		step_title: Type.String({
			description: 'A concise short descriptive title of the step',
		}),
		step_description: Type.String({
			description:
				'The description should be informative and aim to educate the developer about the purpose of the current step. Your tone should be friendly.',
		}),
		step_type: Type.Enum(StepType, {
			description: `Type of the step. Only use '${StepType.USER_ACTION}' in the following cases:
1. If the step requires the user to execute a long running command e.g running the development command or starting an interactive program.
2. If the user needs to take action in a new terminal window.
3. If the user needs to do something in the browser to proceed.
Note: Do NOT use for creating or modifying files.`,
		}),
		bash_command_to_run: Type.Optional(
			Type.String({
				description:
					"The bash command to run. Should be present if the step type is RUN_BASH_COMMAND e.g 'yarn add package'",
			}),
		),
		new_file_path_to_create: Type.Optional(
			Type.Object(
				{
					file_path: Type.String({
						description:
							"The full filepath from the project root directory. e.g './src/utils/foo.ts'",
					}),
					file_extension: Type.String({
						description: "Extension of the file e.g 'tsx' | 'js', | 'env'",
					}),
					file_content_summary: Type.String({
						description: `A concise and detailed summary about the functionality and purpose of the provided file
           e.g 'This file contains the client-side entrypoint for a tRPC API. It creates the 'api' object with
            type-safe React Query hooks and inference helpers for input and output types. It also includes configuration
             for data de-serialization, request flow links, and SSR settings.'`,
					}),
					file_code_changes: Type.String({
						description: `The code to insert into the created file. Format and indent properly. Do not truncate any code. e.g
           'import { postRouter } from "~/server/api/routers/post";
            import { createTRPCRouter } from "~/server/api/trpc";

            export const appRouter = createTRPCRouter({
                post: postRouter,
            });

            export type AppRouter = typeof appRouter;'
           `,
					}),
				},
				{description: 'Should be present if the the step_type is CREATE_FILE'},
			),
		),
		existing_file_path_to_modify: Type.Optional(
			Type.Object(
				{
					file_path: Type.String({
						description:
							"The full filepath from the project root directory. Copy summary from the codebase map e.g './src/utils/foo.ts'",
					}),
					file_extension: Type.String({
						description: "Extension of the file e.g 'tsx' | 'js', | 'env'",
					}),
					current_file_content_summary: Type.String({
						description:
							'Summary of the current purpose of the file. Copy summary from the codebase map.',
					}),
					file_content_summary: Type.String({
						description: `A detailed, concise and complete summary about the functionality and purpose of the provided file. Use the codebase map to inform your description.`,
					}),
				},
				{description: 'Should be present if the step_type is MODIFY_FILE.'},
			),
		),
		user_action: Type.Optional(
			Type.String({
				description:
					'Bash command that the user needs to run. If the user needs to complete a task on a website return the bash command "open ${url to open}". If they need to run a command in a new terminal, return the full bash command. Should be present if the step_type is USER_ACTION',
			}),
		),
	}),
);

export const generateStepsResponseSchema = AIStepsResponseSchema;
