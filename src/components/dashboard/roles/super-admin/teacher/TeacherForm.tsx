// /components/dashboard/roles/super-admin/teacher/TeacherForm.tsx
'use client';

import { api } from "@/utils/api"; // Use client-side TRPC
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { TeacherType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Form schema matching the backend expectations
const teacherFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  teacherType: z.enum(["CLASS", "SUBJECT"]),
  specialization: z.string().optional(),
  campusIds: z.array(z.string()).min(1, "Select at least one campus"),
  subjectIds: z.array(z.string()).optional(),
  classIds: z.array(z.string()).optional(),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

export default function TeacherForm({
  initialData,
  teacherId,
  subjects,
  classes
}: {
  initialData: any;
  teacherId: string;
  subjects: any[];
  classes: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Get campuses for dropdown
  const { data: campuses } = api.campus.getAll.useQuery();
  
  // Get subjects for dropdown
  const { data: subjectsData } = api.subject.getAll.useQuery();
  
  // Get classes for dropdown
  const { data: classesData } = api.class.getAll.useQuery();

  // Create teacher mutation
  const createTeacher = api.teacher.create.useMutation({
    onSuccess: () => {
      toast.success("Teacher created successfully");
      router.push("/dashboard/teachers");
    },
    onError: (error) => {
      toast.error(error.message);
      setLoading(false);
    },
  });

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      teacherType: "SUBJECT",
      campusIds: [],
      subjectIds: [],
      classIds: [],
      ...initialData
    },
  });

  const onSubmit = async (data: TeacherFormValues) => {
    setLoading(true);
    createTeacher.mutate(data);
  };

  const watchTeacherType = form.watch("teacherType");

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Create New Teacher</h2>
        <p className="text-muted-foreground">Add a new teacher to the system</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="teacherType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teacher Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CLASS">Class Teacher</SelectItem>
                    <SelectItem value="SUBJECT">Subject Teacher</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specialization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specialization</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Mathematics, Science" {...field} />
                </FormControl>
                <FormDescription>
                  Area of expertise or specialization
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="campusIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Campuses</FormLabel>
                <FormControl>
                  <MultiSelect
                    selected={field.value}
                    options={
                      campuses?.map((campus) => ({
                        label: campus.name,
                        value: campus.id,
                      })) ?? []
                    }
                    onChange={(values) => field.onChange(values)}
                    placeholder="Select campuses"
                  />
                </FormControl>
                <FormDescription>
                  Select the campuses where this teacher will work
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchTeacherType === "SUBJECT" && (
            <FormField
              control={form.control}
              name="subjectIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Subjects</FormLabel>
                  <FormControl>
                    <MultiSelect
                      selected={field.value ?? []}
                      options={
                        subjectsData?.map((subject) => ({
                          label: subject.name,
                          value: subject.id,
                        })) ?? []
                      }
                      onChange={(values) => field.onChange(values)}
                      placeholder="Select subjects"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchTeacherType === "CLASS" && (
            <FormField
              control={form.control}
              name="classIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Classes</FormLabel>
                  <FormControl>
                    <MultiSelect
                      selected={field.value ?? []}
                      options={
                        classesData?.map((class_) => ({
                          label: class_.name,
                          value: class_.id,
                        })) ?? []
                      }
                      onChange={(values) => field.onChange(values)}
                      placeholder="Select classes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Teacher"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
