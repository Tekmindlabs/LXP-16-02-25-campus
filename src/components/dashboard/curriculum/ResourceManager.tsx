'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/utils/api';
import { FileIcon, UploadIcon } from 'lucide-react';
import { useState } from 'react';
import { ResourceUpload } from './resource-upload';

interface ResourceManagerProps {
	nodeId: string;
}

export function ResourceManager({ nodeId }: ResourceManagerProps) {
	const [showUpload, setShowUpload] = useState(false);
	const { data: resources } = api.curriculum.getResources.useQuery({ nodeId });

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-semibold">Resources</h3>
				<Button onClick={() => setShowUpload(true)}>
					<UploadIcon className="w-4 h-4 mr-2" />
					Upload Resource
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{resources?.map(resource => (
					<Card key={resource.id}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileIcon className="w-4 h-4" />
								{resource.title}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-gray-500">{resource.description}</p>
							<div className="mt-4">
								<Button variant="outline" size="sm" asChild>
									<a href={resource.url} target="_blank" rel="noopener noreferrer">
										View Resource
									</a>
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{showUpload && (
				<ResourceUpload
					nodeId={nodeId}
					onClose={() => setShowUpload(false)}
				/>
			)}
		</div>
	);
}

export default ResourceManager;