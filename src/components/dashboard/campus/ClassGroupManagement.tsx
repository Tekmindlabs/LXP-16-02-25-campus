'use client';

import { useState } from 'react';
import { useCampusContext } from '@/contexts/CampusContext';
import { api } from '@/utils/api';
import { withCampusPermission } from '@/components/hoc/withCampusPermission';
import { CampusPermission } from '@/types/campus';
import { Status } from '@prisma/client';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ClassGroupManagementComponent() {
	const { currentCampus, refreshData } = useCampusContext();
	const [isOpen, setIsOpen] = useState(false);
	const [newGroupName, setNewGroupName] = useState('');

	const { data: classGroups, isLoading } = api.classGroup.getAllClassGroups.useQuery(
		undefined,
		{ enabled: !!currentCampus }
	);

	const createClassGroup = api.classGroup.create.useMutation({
		onSuccess: () => {
			refreshData();
			setIsOpen(false);
			setNewGroupName('');
		},
	});

	const handleCreate = () => {
		if (!currentCampus || !newGroupName.trim()) return;
		
		createClassGroup.mutate({
			name: newGroupName,
			status: Status.ACTIVE,
			programId: '', // This should be selected by the user
			calendar: {
				name: `${newGroupName} Calendar`,
				startDate: new Date(),
				endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
				status: Status.ACTIVE,
			},
		});
	};

	if (isLoading) return <div>Loading...</div>;

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Class Groups</h2>
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogTrigger asChild>
						<Button>Create New Group</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Class Group</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label htmlFor="name">Group Name</Label>
								<Input
									id="name"
									value={newGroupName}
									onChange={(e) => setNewGroupName(e.target.value)}
								/>
							</div>
							<Button onClick={handleCreate}>Create</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{classGroups?.map((group) => (
					<Card key={group.id}>
						<CardHeader>
							<CardTitle>{group.name}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Created: {new Date(group.createdAt).toLocaleDateString()}
							</p>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

export const ClassGroupManagement = withCampusPermission(
	ClassGroupManagementComponent,
	CampusPermission.MANAGE_CLASSES
);