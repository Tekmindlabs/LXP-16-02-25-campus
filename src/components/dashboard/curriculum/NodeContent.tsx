'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurriculumNode } from '@/types/curriculum';

interface NodeContentProps {
	node: CurriculumNode;
}

export function NodeContent({ node }: NodeContentProps) {
	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Learning Objectives</CardTitle>
					<CardDescription>Key learning outcomes for this unit</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="prose dark:prose-invert">
						{node.learningObjectives ? (
							<div dangerouslySetInnerHTML={{ __html: node.learningObjectives }} />
						) : (
							<p className="text-gray-500">No learning objectives defined</p>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Content</CardTitle>
					<CardDescription>Unit content and materials</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="prose dark:prose-invert">
						{node.content ? (
							<div dangerouslySetInnerHTML={{ __html: node.content }} />
						) : (
							<p className="text-gray-500">No content available</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default NodeContent;