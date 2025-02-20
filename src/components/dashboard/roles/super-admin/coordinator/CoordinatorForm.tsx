'use client';

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Status } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { api } from "@/utils/api";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  type: z.enum(['PROGRAM_COORDINATOR', 'CAMPUS_PROGRAM_COORDINATOR']),
  programIds: z.array(z.string()).min(1, "At least one program must be selected"),
  campusId: z.string().optional()
    .superRefine((val, ctx: z.RefinementCtx & { parent: { type: string } }) => {
      if (ctx.parent.type === 'CAMPUS_PROGRAM_COORDINATOR' && !val) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campus selection is required for Campus Program Coordinator"
        });
        return false;
      }
      return true;
    }),
  responsibilities: z.array(z.string()).min(1, "At least one responsibility is required"),
  status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]),
});

type FormValues = z.infer<typeof formSchema>;

interface CoordinatorFormProps {
  selectedCoordinator?: {
    id: string;
    name: string;
    email: string;
    status: Status;
    type: 'PROGRAM_COORDINATOR' | 'CAMPUS_PROGRAM_COORDINATOR';
    coordinatorProfile: {
      programs: { id: string }[];
      campus?: { id: string; name: string };
    };
  };
  programs: { 
    id: string; 
    name: string; 
    level: string;
    campuses?: { id: string; name: string }[];
  }[];
  campuses: { id: string; name: string }[];
  onSuccess: () => void;
}

export const CoordinatorForm = ({ selectedCoordinator, programs, campuses, onSuccess }: CoordinatorFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultResponsibilities = [
    { value: "managing_terms", label: "Managing Terms" },
    { value: "coordinating_teachers", label: "Coordinating Teachers" },
    { value: "program_planning", label: "Program Planning" },
    { value: "assessment_management", label: "Assessment Management" },
    { value: "student_support", label: "Student Support" }
  ];

  const utils = api.useContext();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: selectedCoordinator?.name || "",
      email: selectedCoordinator?.email || "",
      type: selectedCoordinator?.type || "PROGRAM_COORDINATOR",
      programIds: selectedCoordinator?.coordinatorProfile.programs.map(p => p.id) || [],
      campusId: selectedCoordinator?.coordinatorProfile.campus?.id,
      responsibilities: [],
      status: selectedCoordinator?.status || Status.ACTIVE,
    },
  });

  // Filter programs based on selected campus
  const getAvailablePrograms = () => {
    if (form.watch('type') === 'CAMPUS_PROGRAM_COORDINATOR' && form.watch('campusId')) {
      return programs.filter(program => 
        program.campuses?.some(campus => campus.id === form.watch('campusId'))
      );
    }
    return programs;
  };

  // Clear programs when campus changes
  useEffect(() => {
    if (form.watch('type') === 'CAMPUS_PROGRAM_COORDINATOR') {
      form.setValue('programIds', []);
    }
  }, [form.watch('campusId')]);

  // Clear campus and programs when type changes
  useEffect(() => {
    if (form.watch('type') === 'PROGRAM_COORDINATOR') {
      form.setValue('campusId', undefined);
      form.setValue('programIds', []);
    }
  }, [form.watch('type')]);

  const createCoordinator = api.coordinator.createCoordinator.useMutation({
    onSuccess: () => {
      utils.coordinator.searchCoordinators.invalidate();
      form.reset();
      onSuccess();
      toast({
        title: "Success",
        description: "Coordinator created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateCoordinator = api.coordinator.updateCoordinator.useMutation({
    onSuccess: () => {
      utils.coordinator.searchCoordinators.invalidate();
      onSuccess();
      toast({
        title: "Success",
        description: "Coordinator updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Validate campus program coordinator requirements
      if (values.type === 'CAMPUS_PROGRAM_COORDINATOR') {
        if (!values.campusId) {
          throw new Error('Campus selection is required for Campus Program Coordinator');
        }
        
        // Validate selected programs belong to selected campus
        const invalidPrograms = values.programIds.filter(programId => {
          const program = programs.find(p => p.id === programId);
          return !program?.campuses?.some(campus => campus.id === values.campusId);
        });
        
        if (invalidPrograms.length > 0) {
          throw new Error('Some selected programs do not belong to the selected campus');
        }
      }

      if (selectedCoordinator) {
        await updateCoordinator.mutateAsync({
          id: selectedCoordinator.id,
          ...values,
        });
      } else {
        await createCoordinator.mutateAsync(values);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Coordinator Type Field */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coordinator Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PROGRAM_COORDINATOR">Program Coordinator</SelectItem>
                  <SelectItem value="CAMPUS_PROGRAM_COORDINATOR">Campus Program Coordinator</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campus Selection (Conditional) */}
        {form.watch('type') === 'CAMPUS_PROGRAM_COORDINATOR' && (
          <FormField
            control={form.control}
            name="campusId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campus</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {campuses.map(campus => (
                      <SelectItem key={campus.id} value={campus.id}>
                        {campus.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Programs Field */}
        <FormField
          control={form.control}
          name="programIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {form.watch('type') === 'CAMPUS_PROGRAM_COORDINATOR' ? 'Campus Programs' : 'Programs'}
              </FormLabel>
              <FormControl>
                <MultiSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={getAvailablePrograms().map(program => ({
                    label: `${program.name} (${program.level})`,
                    value: program.id
                  }))}
                  placeholder={`Select ${form.watch('type') === 'CAMPUS_PROGRAM_COORDINATOR' ? 'campus programs' : 'programs'}`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Responsibilities Field */}
        <FormField
          control={form.control}
          name="responsibilities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsibilities</FormLabel>
              <FormControl>
                <MultiSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={defaultResponsibilities}
                  placeholder="Select responsibilities"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status Field */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(Status).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {selectedCoordinator ? "Update" : "Create"} Coordinator
        </Button>
      </form>
    </Form>
  );
};