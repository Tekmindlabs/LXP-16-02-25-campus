import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { api } from "@/utils/api";
import { toast } from "@/hooks/use-toast";
import { Status } from "@prisma/client";
import { BasicInformation } from "./components/BasicInformation";
import { TermSystemSection } from "./components/TermSystemSection";
import { AssessmentSystem } from "./components/AssessmentSystem"; 
import { ProgramSubmission } from "./components/ProgramSubmission";
import { ProgramFormData, TermSystemType } from "@/types/program";
import { AssessmentSystemType } from "@/types/assessment";
import { defaultFormData, termConfigs } from "@/constants/program";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { useEffect } from "react";

interface ProgramFormProps {
    selectedProgram?: any;
    coordinators: any[];
    onSuccess: () => void;
}

const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
    </div>
);

export const ProgramForm = ({ selectedProgram, coordinators, onSuccess }: ProgramFormProps) => {
    const [formData, setFormData] = useState<ProgramFormData>(() => 
        selectedProgram ? transformProgramToFormData(selectedProgram) : defaultFormData
    );

    const { data: calendars, isLoading: calendarsLoading, error: calendarsError } = 
        api.calendar.getAll.useQuery();

    const { data: campuses, isLoading: campusesLoading, error: campusesError } = 
        api.campus.getAll.useQuery();

    const utils = api.useContext();

    const createMutation = api.program.create.useMutation({
        onSuccess: handleMutationSuccess,
        onError: handleMutationError
    });

    const updateMutation = api.program.update.useMutation({
        onSuccess: handleMutationSuccess,
        onError: handleMutationError
    });

    const handleFormDataChange = (newData: Partial<ProgramFormData>) => {
        setFormData(prev => ({
            ...prev,
            ...newData
        }));
    };

    const handleTermSystemChange = (type: TermSystemType) => {
        const terms = termConfigs[type].terms.map(term => ({
            ...term,
            startDate: new Date(),
            endDate: new Date(),
            type,
            assessmentPeriods: []
        }));

        handleFormDataChange({
            termSystem: {
                type,
                terms
            }
        });
    };

    const handleAddTerm = (type: TermSystemType) => {
        const newTerm = {
            name: `${type} ${formData.termSystem?.terms.length! + 1}`,
            startDate: new Date(),
            endDate: new Date(),
            type,
            assessmentPeriods: []
        };

        handleFormDataChange({
            termSystem: {
                ...formData.termSystem!,
                terms: [...formData.termSystem!.terms, newTerm]
            }
        });
    };

    const handleRemoveTerm = (index: number) => {
        handleFormDataChange({
            termSystem: {
                ...formData.termSystem!,
                terms: formData.termSystem!.terms.filter((_, i) => i !== index)
            }
        });
    };

    const handleTermChange = (index: number, field: string, value: any) => {
        const updatedTerms = [...formData.termSystem!.terms];
        updatedTerms[index] = {
            ...updatedTerms[index],
            [field]: value
        };

        handleFormDataChange({
            termSystem: {
                ...formData.termSystem!,
                terms: updatedTerms
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm(formData)) return;

        const submissionData = prepareSubmissionData(formData);

        if (selectedProgram) {
            updateMutation.mutate({
                id: selectedProgram.id,
                ...submissionData
            });
        } else {
            createMutation.mutate({
                ...submissionData,
                campusIds: submissionData.campusIds // Ensure we're using campusIds
            });
        }
    };

    function handleMutationSuccess() {
        utils.program.getAll.invalidate();
        onSuccess();
        toast({
            title: "Success",
            description: "Program saved successfully"
        });
    }

    function handleMutationError(error: any) {
        toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
        });
    }

    if (calendarsLoading || campusesLoading) {
        return <LoadingSpinner />;
    }

    if (calendarsError || campusesError) {
        return (
            <Alert variant="destructive">
                <AlertTitle>{calendarsError?.message || campusesError?.message || 'An error occurred'}</AlertTitle>
            </Alert>
        );
    }

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>
                    {selectedProgram ? "Edit" : "Create"} Program
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ProgramSubmission 
                    isSubmitting={createMutation.isPending || updateMutation.isPending}
                    isEditing={!!selectedProgram}
                    onSubmit={handleSubmit}
                >
                    <BasicInformation
                        formData={formData}
                        calendars={calendars || []}
                        coordinators={coordinators}
                        campuses={campuses || []}
                        onFormDataChange={handleFormDataChange}
                    />

                    <TermSystemSection
                        termSystem={formData.termSystem!}
                        onTermSystemTypeChange={handleTermSystemChange}
                        onAddTerm={handleAddTerm}
                        onRemoveTerm={handleRemoveTerm}
                        onTermChange={handleTermChange}
                    />

                    <AssessmentSystem
                        formData={formData}
                        onFormDataChange={handleFormDataChange}
                    />
                </ProgramSubmission>
            </CardContent>
        </Card>
    );
};

const transformProgramToFormData = (program: any): ProgramFormData => {
    if (!program) return defaultFormData;
    
    return {
        name: program.name,
        description: program.description,
        calendarId: program.calendarId || "",
        campusId: program.campuses?.map((campus: any) => campus.id) || [],
        coordinatorId: program.coordinatorId || "",
        status: program.status,
        termSystem: {
            type: program.termStructures?.[0]?.type || "SEMESTER",
            terms: program.termStructures?.map((term: any) => ({
                name: term.name,
                startDate: new Date(term.startDate),
                endDate: new Date(term.endDate),
                type: term.type,
                assessmentPeriods: term.assessmentPeriods?.map((period: any) => ({
                    name: period.name,
                    startDate: new Date(period.startDate),
                    endDate: new Date(period.endDate),
                    weight: period.weight
                })) || []
            })) || []
        },
        assessmentSystem: {
            type: program.assessmentSystem?.type || "STANDARD",
            markingScheme: program.assessmentSystem?.type === "MARKING_SCHEME" 
                ? {
                    maxMarks: program.assessmentSystem.markingSchemes?.[0]?.maxMarks || 100,
                    passingMarks: program.assessmentSystem.markingSchemes?.[0]?.passingMarks || 40,
                    gradingScale: program.assessmentSystem.markingSchemes?.[0]?.gradingScale || [
                        { grade: 'A', minPercentage: 80, maxPercentage: 100 },
                        { grade: 'B', minPercentage: 70, maxPercentage: 79 },
                        { grade: 'C', minPercentage: 60, maxPercentage: 69 },
                        { grade: 'D', minPercentage: 50, maxPercentage: 59 },
                        { grade: 'E', minPercentage: 40, maxPercentage: 49 },
                        { grade: 'F', minPercentage: 0, maxPercentage: 39 }
                    ]
                }
                : undefined,
            rubric: program.assessmentSystem?.type === "RUBRIC"
                ? program.assessmentSystem.rubrics?.[0] || null
                : undefined,
            cgpaConfig: program.assessmentSystem?.type === "CGPA"
                ? program.assessmentSystem.cgpaConfig || null
                : undefined
        }
    };
};

const validateForm = (formData: ProgramFormData): boolean => {
        if (!formData.name.trim()) {
        toast({
            title: "Validation Error",
            description: "Program name is required",
            variant: "destructive"
        });
        return false;
    }
    if (formData.calendarId === "NO_SELECTION") {
        toast({
            title: "Validation Error",
            description: "Please select a calendar",
            variant: "destructive"
        });
        return false;
    }
    return true;
};

const prepareSubmissionData = (formData: ProgramFormData) => {
    return {
        name: formData.name.trim(),
        description: formData.description?.trim(),
        calendarId: formData.calendarId,
        coordinatorId: formData.coordinatorId === "NO_SELECTION" ? 
            undefined : formData.coordinatorId,
        campusIds: formData.campusId, // Ensure we're using campusIds here
        status: formData.status,
        termSystem: formData.termSystem,
        assessmentSystem: formData.assessmentSystem
    };
};



