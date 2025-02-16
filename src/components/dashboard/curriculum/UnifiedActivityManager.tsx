'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityScope, ActivityType, UnifiedActivity } from '@/types/class-activity';
import { api } from '@/utils/api';

interface ActivityListProps {
	activities?: UnifiedActivity[];
	onEdit: (id: string) => void;
	scope: ActivityScope;
}

const ActivityList = ({ activities, onEdit, scope }: ActivityListProps) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{activities?.map(activity => (
				<Card key={activity.id}>
					<CardHeader>
						<CardTitle>{activity.title}</CardTitle>
						<CardDescription>{activity.type}</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-500">
							{activity.description}
						</p>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button
							variant="outline"
							size="sm"
							onClick={() => onEdit(activity.id)}
						>
							Edit
						</Button>
						{scope === ActivityScope.CURRICULUM && (
							<Badge>Curriculum</Badge>
						)}
					</CardFooter>
				</Card>
			))}
		</div>
	);
};

interface UnifiedActivityManagerProps {
	subjectId: string;
	classId?: string;
	curriculumNodeId?: string;
	scope?: ActivityScope;
}

export function UnifiedActivityManager({
	subjectId,
	classId,
	curriculumNodeId,
	scope = ActivityScope.CLASS
}: UnifiedActivityManagerProps) {
	const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
	const [view, setView] = useState<'list' | 'form' | 'templates'>('list');

	const { data: activities } = api.activity.getAll.useQuery({
		subjectId,
		classId,
		curriculumNodeId,
		scope
	});

	return (
		<div>
			<div className="flex justify-between mb-4">
				<h2 className="text-2xl font-bold">Activities</h2>
				<div className="space-x-2">
					{classId && (
						<Button onClick={() => setView('templates')}>
							Browse Templates
						</Button>
					)}
					<Button onClick={() => setView('form')}>
						Create Activity
					</Button>
				</div>
			</div>

			{view === 'list' && (
				<ActivityList
					activities={activities}
					onEdit={setSelectedActivity}
					scope={scope}
				/>
			)}

			{view === 'form' && (
				<ActivityForm
					activityId={selectedActivity}
					subjectId={subjectId}
					classId={classId}
					curriculumNodeId={curriculumNodeId}
					scope={scope}
					onClose={() => {
						setSelectedActivity(null);
						setView('list');
					}}
				/>
			)}

			{view === 'templates' && classId && (
				<ActivityTemplates
					subjectId={subjectId}
					onSelect={(templateId) => {
						// Clone template logic will be implemented in the API
						api.activity.cloneTemplate.mutate({
							templateId,
							classId
						}, {
							onSuccess: () => {
								setView('list');
							}
						});
					}}
				/>
			)}
		</div>
	);
}

// Export the component as default
export default UnifiedActivityManager;