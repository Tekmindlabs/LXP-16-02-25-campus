'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { api } from "@/utils/api";
import { toast } from "@/hooks/use-toast";
import { Status, Program } from "@prisma/client";
import { Campus } from "@/types/campus";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AssessmentSystemType } from "@/types/assessment";
import { TermSystemSection } from "./components/TermSystemSection";

enum CoordinatorType {
  PROGRAM_COORDINATOR = 'PROGRAM_COORDINATOR',
  CAMPUS_COORDINATOR = 'CAMPUS_COORDINATOR',
  CAMPUS_PROGRAM_COORDINATOR = 'CAMPUS_PROGRAM_COORDINATOR'
}

enum TermSystemType {
  SEMESTER = "SEMESTER",
  TERM = "TERM",
  QUARTER = "QUARTER"
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, { message: "Program name is required" }),
  description: z.string().optional(),
  calendarId: z.string().min(1, { message: "Calendar is required" }),
  campusIds: z.array(z.string()).min(1, { message: "At least one campus is required" }),
  coordinatorId: z.string().optional(),
  coordinatorType: z.nativeEnum(CoordinatorType).optional(),
  status: z.nativeEnum(Status),
  termSystem: z.object({
    type: z.nativeEnum(TermSystemType),
    terms: z.array(z.object({
      name: z.string(),
      startDate: z.date(),
      endDate: z.date(),
      type: z.nativeEnum(TermSystemType),
      assessmentPeriods: z.array(z.object({
        name: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        weight: z.number()
      }))
    }))
  }).optional(),
  assessmentSystem: z.object({
    type: z.nativeEnum(AssessmentSystemType),
    markingScheme: z.object({
      gradingScale: z.array(z.object({
        grade: z.string(),
        minPercentage: z.number(),
        maxPercentage: z.number()
      })),
      maxMarks: z.number(),
      passingMarks: z.number()
    }).optional(),
    rubric: z.any().optional(),
    cgpaConfig: z.any().optional()
  }).optional()
});

interface ProgramFormProps {
  selectedProgram?: Program & {
    campuses: Campus[];
    termStructures?: any[];
    assessmentSystem?: any;
  };
  coordinators: any[];
  onSuccess?: () => void;
}

const transformProgramToFormData = (program: ProgramFormProps['selectedProgram']) => {
  if (!program) return undefined;
  
  return {
    name: program.name || "", // Ensure name is never null
    description: program.description || "",
    calendarId: program.calendarId,
    campusIds: program.campuses.map(campus => campus.id),
    coordinatorId: program.coordinatorId || undefined,
    status: program.status,
    termSystem: program.termStructures?.[0] || undefined,
    assessmentSystem: program.assessmentSystem || undefined
  };
};

export const ProgramForm = ({ selectedProgram, coordinators, onSuccess }: ProgramFormProps) => {
  const utils = api.useContext();

  const handleMutationSuccess = (message: string) => {
    utils.program.getAll.invalidate();
    onSuccess?.();
    toast({
      title: "Success",
      description: message
    });
  };

  const handleMutationError = (error: any) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive"
    });
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: selectedProgram ? transformProgramToFormData(selectedProgram) : {
      name: "",
      description: "",
      calendarId: "",
      campusIds: [],
      status: Status.ACTIVE,
      coordinatorId: undefined,
      coordinatorType: undefined,
      termSystem: undefined,
      assessmentSystem: undefined
    }
  });

  const { data: calendars, isLoading: calendarsLoading } = api.calendar.getAll.useQuery();
  const { data: campuses, isLoading: campusesLoading } = api.campus.getAll.useQuery();

  const createMutation = api.program.create.useMutation({
    onSuccess: () => handleMutationSuccess("Program created successfully"),
    onError: handleMutationError
  });

  const updateMutation = api.program.update.useMutation({
    onSuccess: () => handleMutationSuccess("Program updated successfully"),
    onError: handleMutationError
  });

  if (calendarsLoading || campusesLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (selectedProgram) {
        await updateMutation.mutateAsync({
          id: selectedProgram.id,
          ...data
        });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>
          {selectedProgram ? "Edit" : "Create"} Program
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Information */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Coordinator Type Selection */}
            <FormField
              control={form.control}
              name="coordinatorType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordinator Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a coordinator type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CoordinatorType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assessment System */}
            <FormField
              control={form.control}
              name="assessmentSystem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment System</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange({
                        type: value as AssessmentSystemType,
                        markingScheme: undefined,
                        rubric: undefined,
                        cgpaConfig: undefined
                      });
                    }}
                    value={field.value?.type}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assessment system" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AssessmentSystemType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Term System */}
            <FormField
              control={form.control}
              name="termSystem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term System</FormLabel>
                  <TermSystemSection
                    termSystem={field.value || { type: 'SEMESTER', terms: [] }}
                    selectedProgram={selectedProgram}
                    onTermSystemTypeChange={(type) => {
                      field.onChange({ type, terms: [] });
                    }}
                    onAddTerm={(type) => {
                      const terms = field.value?.terms || [];
                      field.onChange({
                        type,
                        terms: [...terms, {
                          name: `Term ${terms.length + 1}`,
                          startDate: new Date(),
                          endDate: new Date(),
                          type: type,
                          assessmentPeriods: []
                        }]
                      });
                    }}
                    onRemoveTerm={(index) => {
                      const terms = [...(field.value?.terms || [])];
                      terms.splice(index, 1);
                      field.onChange({ ...field.value, terms });
                    }}
                    onTermChange={(index, fieldName, value) => {
                      const terms = [...(field.value?.terms || [])];
                      terms[index] = { ...terms[index], [fieldName]: value };
                      field.onChange({ ...field.value, terms });
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">
              {selectedProgram ? "Update" : "Create"} Program
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
