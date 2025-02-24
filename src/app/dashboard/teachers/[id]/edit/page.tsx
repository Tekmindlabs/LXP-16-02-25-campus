'use client';

import { useParams } from 'next/navigation';
import { api } from '@/utils/api';
import TeacherForm from '@/components/dashboard/roles/super-admin/teacher/TeacherForm';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EditTeacherPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  const [error, setError] = useState<string | null>(null);

  // Fetch teacher data with error handling
  const { 
    data: teacher, 
    isLoading: isLoadingTeacher,
    error: teacherError 
  } = api.teacher.getById.useQuery(teacherId, {
    retry: false,
    onError: (error) => {
      setError(error.message);
    }
  });

  // Fetch subjects with proper parameters
  const { 
    data: subjects = [], 
    isLoading: isLoadingSubjects 
  } = api.subject.searchSubjects.useQuery({
    status: 'ACTIVE' as const,
    search: undefined,
    classGroupIds: undefined,
    teacherIds: undefined
  }, {
    retry: false,
    onError: (error) => {
      setError(error.message);
    }
  });

  // Fetch classes with proper parameters
  const { 
    data: classes = [], 
    isLoading: isLoadingClasses 
  } = api.class.searchClasses.useQuery({
    status: 'ACTIVE' as const,
    search: undefined,
    campusId: undefined,
    classGroupId: undefined
  }, {
    retry: false,
    onError: (error) => {
      setError(error.message);
    }
  });

  const handleCancel = () => {
    router.back();
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (isLoadingTeacher || isLoadingSubjects || isLoadingClasses) {
    return <div>Loading...</div>;
  }

  if (!teacher) {
    return <div>Teacher not found</div>;
  }

  const initialData = {
    name: teacher.name ?? '',
    email: teacher.email ?? '',
    phoneNumber: teacher.phoneNumber || '',
    teacherType: teacher.teacherProfile?.teacherType,
    specialization: teacher.teacherProfile?.specialization || '',
    subjectIds: teacher.teacherProfile?.subjects?.map(s => s.subject.id) || [],
    classIds: teacher.teacherProfile?.classes?.map(c => c.class.id) || [],
    campusIds: [] // Add if required
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Teacher</h1>
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <TeacherForm
          initialData={initialData}
          teacherId={teacherId}
          subjects={subjects}
          classes={classes}
          isCreate={false}
        />
      </div>
    </div>
  );
}