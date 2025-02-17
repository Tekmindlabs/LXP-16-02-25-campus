'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { api } from "@/utils/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Status, CalendarType } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";

interface Program {
	id: string;
	name: string;
}

interface Subject {
	id: string;
	name: string;
	code: string;
}

interface Calendar {
	id: string;
	name: string;
	description: string | null;
	type: CalendarType;
	status: Status;
}

interface FormData {
	name: string;
	description?: string;
	programId: string;
	campusId: string;
	status: Status;
	calendar: {
		id: string;
		inheritSettings: boolean;
	};
	subjectIds: string[];
}

interface Props {
	selectedClassGroup?: {
		id: string;
		name: string;
		description: string | null;
		programId: string;
		campusId: string;
		status: Status;
		calendarId?: string;
		subjects?: Subject[];
	};
	onSuccess?: () => void;
}


export const ClassGroupForm = ({ selectedClassGroup, onSuccess }: Props) => {

	const [formData, setFormData] = useState<FormData>({
		name: selectedClassGroup?.name || "",
		description: selectedClassGroup?.description || undefined,
		programId: selectedClassGroup?.programId || "",
		campusId: selectedClassGroup?.campusId || "",
		status: selectedClassGroup?.status || Status.ACTIVE,
		calendar: {
			id: selectedClassGroup?.calendarId || "",
			inheritSettings: false
		},
		subjectIds: selectedClassGroup?.subjects?.map(s => s.id) || []
	});

	const { 
		data: calendars, 
		isLoading: calendarsLoading, 
		error: calendarsError 
	} = api.calendar.getAll.useQuery();
	
	const { 
		data: subjects, 
		isLoading: subjectsLoading, 
		error: subjectsError 
	} = api.subject.searchSubjects.useQuery({ search: "", status: Status.ACTIVE });
	
	const { 
		data: campuses, 
		isLoading: campusesLoading, 
		error: campusesError 
	} = api.campus.getAll.useQuery();

	const {
		data: programs,
		isLoading: programsLoading,
		error: programsError
	} = api.program.getAll.useQuery({});

	const loading = calendarsLoading || subjectsLoading || campusesLoading || programsLoading;
	const error = calendarsError || subjectsError || campusesError || programsError;

	if (loading) {
		return <LoadingSpinner />;
	}

	if (error) {
		return <ErrorAlert message={error.message || 'An error occurred while loading data'} />;
	}


	if (!programs || !campuses || !subjects || !calendars) {
		return <ErrorAlert message="Required data is missing" />;
	}

	const handleCampusChange = (value: string) => {
		setFormData({ ...formData, campusId: value });
	};


	const utils = api.useContext();
	const { toast } = useToast();

	const createMutation = api.classGroup.create.useMutation({
		onSuccess: () => {
			toast({
				title: "Success",
				description: "Class group created successfully",
			});
			utils.classGroup.getAllClassGroups.invalidate();
			onSuccess?.();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const updateMutation = api.classGroup.update.useMutation({
		onSuccess: () => {
			toast({
				title: "Success",
				description: "Class group updated successfully",
			});
			utils.classGroup.getAllClassGroups.invalidate();
			onSuccess?.();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedClassGroup) {
			updateMutation.mutate({
				id: selectedClassGroup.id,
				name: formData.name,
				description: formData.description,
				programId: formData.programId,
				campusId: formData.campusId,
				status: formData.status,
				calendar: {
					id: formData.calendar.id,
					inheritSettings: formData.calendar.inheritSettings
				},
				subjectIds: formData.subjectIds
			});
		} else {
			if (!formData.campusId) {
				toast({
					title: "Error",
					description: "Campus is required",
					variant: "destructive",
				});
				return;
			}

			createMutation.mutate({
				name: formData.name,
				description: formData.description,
				programId: formData.programId,
				campusId: formData.campusId,
				status: formData.status,
				calendar: {
					id: formData.calendar.id,
					inheritSettings: formData.calendar.inheritSettings
				},
				subjectIds: formData.subjectIds
			});
		}
	};



	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					value={formData.name}
					onChange={(e) => setFormData({ ...formData, name: e.target.value })}
					required
				/>
			</div>

			<div>
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					value={formData.description}
					onChange={(e) => setFormData({ ...formData, description: e.target.value })}
				/>
			</div>

			<div>
				<Label htmlFor="program">Program</Label>
				<Select
					value={formData.programId}
					onValueChange={(value) => setFormData({ ...formData, programId: value })}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a program" />
					</SelectTrigger>
					<SelectContent>
						{programs.map((program: Program) => (
							<SelectItem key={program.id} value={program.id}>
								{program.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div>
				<Label htmlFor="campus">Campus</Label>
				<Select
					value={formData.campusId}
					onValueChange={handleCampusChange}
					required
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select a campus" />
					</SelectTrigger>
					<SelectContent>
						{campuses?.map((campus) => (
							<SelectItem key={campus.id} value={campus.id}>
								{campus.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{!formData.campusId && (
					<p className="text-sm text-red-500 mt-1">Campus is required</p>
				)}
				<FormMessage />
			</div>

			<div>
				<Label htmlFor="calendar">Calendar</Label>
				<Select
					value={formData.calendar.id}
					onValueChange={(value) => setFormData({
						...formData,
						calendar: { ...formData.calendar, id: value }
					})}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a calendar" />
					</SelectTrigger>
					<SelectContent>
						{calendars?.map((calendar: Calendar) => (
							<SelectItem key={calendar.id} value={calendar.id}>
								{calendar.name || 'Unnamed Calendar'}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div>
				<Label>Subjects</Label>
				<MultiSelect
					options={subjects?.map(subject => ({
						label: `${subject.name} (${subject.code})`,
						value: subject.id,
					})) || []}
					value={formData.subjectIds}
					onChange={(values) => setFormData({ ...formData, subjectIds: values })}
					placeholder="Select subjects"
				/>
			</div>

			<Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
				{selectedClassGroup ? "Update" : "Create"} Class Group
			</Button>
		</form>
	);
};
