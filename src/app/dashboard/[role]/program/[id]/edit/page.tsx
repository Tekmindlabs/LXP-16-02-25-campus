'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramForm } from "@/components/dashboard/roles/super-admin/program/ProgramForm";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useParams as useNextParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function EditProgramPage() {
	const router = useRouter();
	const params = useNextParams();
	const programId = params?.id as string;
	
	const { data: program, isLoading: programLoading } = api.program.getById.useQuery(programId);
	const { data: coordinators, isLoading: coordinatorsLoading } = api.program.getAvailableCoordinators.useQuery();
	const { data: campuses, isLoading: campusesLoading } = api.campus.getAll.useQuery();
	const { data: calendars, isLoading: calendarsLoading } = api.calendar.getAll.useQuery();

	const isLoading = programLoading || coordinatorsLoading || campusesLoading || calendarsLoading;

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (!program) {
		return <div>Program not found</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-3xl font-bold tracking-tight">Edit Program</h2>
				<Button variant="outline" onClick={() => router.back()}>Back</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Program Details</CardTitle>
				</CardHeader>
				<CardContent>
					<ProgramForm
						coordinators={coordinators || []}
						campuses={campuses || []}
						calendars={calendars || []}
						selectedProgram={program}
						onSuccess={() => router.push('/dashboard/super-admin/program')}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
