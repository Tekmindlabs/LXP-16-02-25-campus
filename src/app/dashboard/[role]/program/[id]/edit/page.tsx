'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramForm } from "@/components/dashboard/roles/super-admin/program/ProgramForm";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Program, ProgramFormProps } from "@/types/program";
import { AssessmentSystemType } from "@/types/assessment";
import { TermSystemType } from "@/types/program";

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
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

  const transformedProgram = {
	id: program.id,
	name: program.name ?? "",
	description: program.description ?? undefined,
	calendarId: program.calendar.id,
	coordinatorId: program.coordinator?.id,
	status: program.status,
	campuses: program.campuses.map(campus => ({ id: campus.id })),
	termStructures: program.terms?.map((term: Term) => ({
	  type: term.type as TermSystemType,
	  name: term.name,
	  startDate: new Date(term.startDate),
	  endDate: new Date(term.endDate),
	  assessmentPeriods: term.assessmentPeriods?.map((period: AssessmentPeriod) => ({
		name: period.name,
		startDate: new Date(period.startDate),
		endDate: new Date(period.endDate),
		weight: period.weight
	  })) ?? []
	})) ?? [],
	assessmentSystem: program.assessmentSystem ? {
	  type: program.assessmentSystem.type as AssessmentSystemType,
	  markingSchemes: program.assessmentSystem.markingSchemes?.map(scheme => ({
		maxMarks: scheme.maxMarks,
		passingMarks: scheme.passingMarks,
		gradingScale: scheme.gradingScale
	  })) ?? [],
	  rubrics: program.assessmentSystem.rubrics ?? undefined,
	  cgpaConfig: program.assessmentSystem.cgpaConfig ?? undefined
	} : undefined
  };

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
            selectedProgram={transformedProgram}
            coordinators={coordinators?.map(coord => ({
              id: coord.id,
              user: {
                name: coord.user.name || ""
              }
            })) ?? []}
            campuses={campuses ?? []}
            calendars={calendars ?? []}
            onSuccess={() => router.push('/dashboard/super-admin/program')}
          />
        </CardContent>
      </Card>
    </div>
  );
}




