'use client';

import { useParams } from 'next/navigation';
import { api } from '@/utils/api';
import { TeacherForm } from '@/components/dashboard/roles/super-admin/teacher/TeacherForm';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Status } from "@/types/enums";
import { TeacherProfile } from "@/types/teacher";

interface Teacher {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  status: Status;
  teacherProfile?: TeacherProfile | null;
}

export default function EditTeacherPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  if (!teacherId) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent>
            <div className="text-center text-red-500">Invalid teacher ID</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch teacher data
  const { data: teacher, isLoading: isLoadingTeacher } = api.teacher.getById.useQuery(
    String(teacherId)
  );

  // Fetch subjects
  const { data: subjects = [], isLoading: isLoadingSubjects } = api.subject.searchSubjects.useQuery({});

  // Fetch classes
  const { data: classes = [], isLoading: isLoadingClasses } = api.class.searchClasses.useQuery({});

  const handleCancel = () => {
    router.back();
  };

  if (isLoadingTeacher || isLoadingSubjects || isLoadingClasses) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent>
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent>
            <div className="text-center text-red-500">Teacher not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initialData = {
    name: teacher.name,
    email: teacher.email,
    phoneNumber: teacher.phoneNumber || '',
    teacherType: teacher.teacherProfile?.teacherType,
    specialization: teacher.teacherProfile?.specialization || '',
    subjectIds: teacher.teacherProfile?.subjects?.map(s => s.subject.id) || [],
    classIds: teacher.teacherProfile?.classes?.map(c => c.class.id) || [],
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Teacher</CardTitle>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </CardHeader>
        <CardContent>
          <TeacherForm
            initialData={initialData}
            teacherId={teacherId}
            subjects={subjects}
            classes={classes}
            isCreate={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}