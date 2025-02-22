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


enum TermSystemType {
    SEMESTER = "SEMESTER",
    TERM = "TERM",
    QUARTER = "QUARTER"
  }

enum AssessmentSystemType {
  MARKING_SCHEME = "MARKING_SCHEME",
  RUBRIC = "RUBRIC",
  HYBRID = "HYBRID",
  CGPA = "CGPA"
}

// Update the form schema
const formSchema = z.object({
  name: z.string().min(1, { message: "Program name is required" }),
  description: z.string().optional(),
  calendarId: z.string().min(1, { message: "Calendar is required" }),
  campusIds: z.array(z.string()).min(1, { message: "At least one campus is required" }),
  coordinatorId: z.string().optional(),
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

export const ProgramForm = ({
  selectedProgram,
  coordinators,
  onSuccess
}: ProgramFormProps) => {
  // Success handler - moved up
  const handleMutationSuccess = (message: string) => {
    utils.program.getAll.invalidate();
    onSuccess?.();
    toast({
      title: "Success",
      description: message
    });
  };

  // Error handler - moved up
  const handleMutationError = (error: any) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive"
    });
  };

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: selectedProgram ? transformProgramToFormData(selectedProgram) : {
      name: "",
      description: "",
      calendarId: "",
      campusIds: [],
      status: Status.ACTIVE,
      coordinatorId: undefined,
      termSystem: undefined,
      assessmentSystem: undefined
    }
  });

  // API queries
  const { data: calendars, isLoading: calendarsLoading } = api.calendar.getAll.useQuery();
  const { data: campuses, isLoading: campusesLoading } = api.campus.getAll.useQuery();
  const utils = api.useContext();

  // Mutations
  const createMutation = api.program.create.useMutation({
    onSuccess: () => handleMutationSuccess("Program created successfully"),
    onError: handleMutationError
  });

  const updateMutation = api.program.update.useMutation({
    onSuccess: () => handleMutationSuccess("Program updated successfully"),
    onError: handleMutationError
  });

  // Loading state
  if (calendarsLoading || campusesLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Form submission
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Calendar Selection */}
            <FormField
              control={form.control}
              name="calendarId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calendar</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a calendar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {calendars?.map((calendar) => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          {calendar.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campus Selection */}
            <FormField
              control={form.control}
              name="campusIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campuses</FormLabel>
                  <FormControl>
                    <MultiSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={campuses?.map(campus => ({
                        label: campus.name,
                        value: campus.id
                      })) || []}
                      placeholder="Select campuses"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Coordinator Selection */}
            <FormField
              control={form.control}
              name="coordinatorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordinator</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a coordinator" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {coordinators?.map((coordinator) => (
                        <SelectItem key={coordinator.id} value={coordinator.id}>
                          {coordinator.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {selectedProgram ? "Update" : "Create"} Program
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// Helper function to transform program data
function transformProgramToFormData(program: Program & { 
  campuses: Campus[]; 
  termStructures?: any[]; 
  assessmentSystem?: any; 
}) {
  return {
    name: program.name || "",  // Handle null case
    description: program.description || "",
    calendarId: program.calendarId,
    campusIds: program.campuses.map(campus => campus.id),
    coordinatorId: program.coordinatorId || undefined,
    status: program.status,
    termSystem: program.termStructures ? {
      type: program.termSystem as TermSystemType,
      terms: program.termStructures.map(structure => ({
        name: structure.name,
        startDate: new Date(structure.startDate),
        endDate: new Date(structure.endDate),
        type: program.termSystem as TermSystemType,
        assessmentPeriods: structure.assessmentPeriods || []
      }))
    } : undefined,
    assessmentSystem: program.assessmentSystem ? {
      type: program.assessmentSystem.type as AssessmentSystemType,
      markingScheme: program.assessmentSystem.markingScheme || undefined,
      rubric: program.assessmentSystem.rubric || undefined,
      cgpaConfig: program.assessmentSystem.cgpaConfig || undefined
    } : undefined
  };
}
