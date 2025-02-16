'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CurriculumNode } from '@/types/curriculum';
import { api } from '@/utils/api';
import { ChevronRight, FolderIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurriculumTreeProps {
	subjectId: string;
	onNodeSelect: (node: CurriculumNode) => void;
}

export function CurriculumTree({ subjectId, onNodeSelect }: CurriculumTreeProps) {
	const { data: nodes } = api.curriculum.getNodes.useQuery({ subjectId });

	const renderNode = (node: CurriculumNode) => (
		<div key={node.id} className="pl-4">
			<Button
				variant="ghost"
				className={cn(
					"w-full justify-start gap-2 font-normal",
					"hover:bg-accent hover:text-accent-foreground"
				)}
				onClick={() => onNodeSelect(node)}
			>
				<div className="flex items-center gap-2">
					{node.children?.length ? (
						<ChevronRight className="h-4 w-4" />
					) : (
						<FolderIcon className="h-4 w-4" />
					)}
					<span>{node.title}</span>
				</div>
			</Button>
			{node.children?.length > 0 && (
				<div className="pl-4">
					{node.children.map(child => renderNode(child))}
				</div>
			)}
		</div>
	);

	return (
		<ScrollArea className="h-[calc(100vh-4rem)]">
			<div className="p-2">
				<h2 className="mb-4 text-lg font-semibold">Curriculum Structure</h2>
				{nodes?.map(node => renderNode(node))}
			</div>
		</ScrollArea>
	);
}

export default CurriculumTree;