'use client';

import { useParams } from 'next/navigation';
import { api } from '@/utils/api';
import TeacherForm from '@/components/dashboard/roles/super-admin/teacher/TeacherForm';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function EditTeacherPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  // Fetch teacher data
  const { data: teacher, isLoading: isLoadingTeacher } = api.teacher.getById.useQuery(teacherId);

  // Fetch subjects
  const { data: subjects = [], isLoading: isLoadingSubjects } = api.subject.searchSubjects.useQuery({
    status: 'ACTIVE'
  });

  // Fetch classes
  const { data: classes = [], isLoading: isLoadingClasses } = api.class.searchClasses.useQuery({
    status: 'ACTIVE'
  });

  const handleCancel = () => {
    router.back();
  };

  if (isLoadingTeacher || isLoadingSubjects || isLoadingClasses) {
    return <div>Loading...</div>;
  }

  if (!teacher) {
    return <div>Teacher not found</div>;
  }

  const initialData = {
    name: teacher.name,
    email: teacher.email,
    phoneNumber: teacher.phoneNumber || '',
    teacherType: teacher.teacherProfile?.teacherType,
    specialization: teacher.teacherProfile?.specialization || '',
    subjectIds: teacher.teacherProfile?.subjects.map(s => s.subject.id) || [],
    classIds: teacher.teacherProfile?.classes.map(c => c.class.id) || [],
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
