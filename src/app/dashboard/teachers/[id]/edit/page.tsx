'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TeacherForm from "@/components/TeacherForm"; // Adjust path as needed
import { api } from "@/utils/api";
import { Status } from "@prisma/client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface EditTeacherPageProps {
  params: {
    id: string;
  };
}

export default function EditTeacherPage({ params }: EditTeacherPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get teacher data
  const teacherQuery = api.teacher.getById.useQuery(params.id, {
    enabled: Boolean(params.id),
    retry: 1,
    onError: (error) => {
      console.error("Teacher fetch error:", error);
      setError(error.message);
    }
  });

  // Get subjects with required input structure
  const subjectsQuery = api.subject.searchSubjects.useQuery({
    search: "",
    classGroupIds: [],
    teacherIds: [],
    status: Status.ACTIVE
  }, {
    retry: 1,
    onError: (error) => {
      console.error("Subjects fetch error:", error);
    }
  });

  // Get classes with required input structure
  const classesQuery = api.class.searchClasses.useQuery({
    search: "",
    status: Status.ACTIVE,
    classGroupId: undefined,
    teacherId: undefined,
    campusId: undefined
  }, {
    retry: 1,
    onError: (error) => {
      console.error("Classes fetch error:", error);
    }
  });

  useEffect(() => {
    if (!teacherQuery.isLoading && !subjectsQuery.isLoading && !classesQuery.isLoading) {
      setIsLoading(false);
    }
  }, [teacherQuery.isLoading, subjectsQuery.isLoading, classesQuery.isLoading]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || teacherQuery.error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent>
            <div className="text-center text-red-500">
              {error || teacherQuery.error?.message || "Failed to load teacher data"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!teacherQuery.data) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent>
            <div className="text-center">Teacher not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teacher = teacherQuery.data;

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Teacher</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherForm
            teacherId={params.id}
            initialData={{
              name: teacher.name || "",
              email: teacher.email || "",
              phoneNumber: teacher.phoneNumber || "",
              teacherType: teacher.teacherProfile?.teacherType,
              specialization: teacher.teacherProfile?.specialization || "",
              campusIds: teacher.teacherProfile?.campuses?.map(c => c.id) || [],
              subjectIds: teacher.teacherProfile?.subjects?.map(s => s.id) || [],
              classIds: teacher.teacherProfile?.classes?.map(c => c.id) || [],
            }}
            subjects={subjectsQuery.data || []}
            classes={classesQuery.data || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}