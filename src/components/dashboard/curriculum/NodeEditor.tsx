'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CurriculumNode } from '@/types/curriculum';
import { api } from '@/utils/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { NovelEditor } from '@/components/ui/novel-editor';

const nodeSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().optional(),
	learningObjectives: z.string().optional(),
	content: z.string().optional()
});

type FormData = z.infer<typeof nodeSchema>;

interface NodeEditorProps {
	node: CurriculumNode | null;
	onClose: () => void;
}

export function NodeEditor({ node, onClose }: NodeEditorProps) {
	const form = useForm<FormData>({
		resolver: zodResolver(nodeSchema),
		defaultValues: {
			title: node?.title || '',
			description: node?.description || '',
			learningObjectives: node?.learningObjectives || '',
			content: node?.content || ''
		}
	});

	const { mutate: updateNode } = api.curriculum.updateNode.useMutation({
		onSuccess: () => {
			onClose();
		}
	});

	const onSubmit = (data: FormData) => {
		if (node) {
			updateNode({
				id: node.id,
				...data
			});
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="learningObjectives"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Learning Objectives</FormLabel>
							<FormControl>
								<NovelEditor {...field} />
							</FormControl>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Content</FormLabel>
							<FormControl>
								<NovelEditor {...field} />
							</FormControl>
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit">
						Save Changes
					</Button>
				</div>
			</form>
		</Form>
	);
}

export default NodeEditor;