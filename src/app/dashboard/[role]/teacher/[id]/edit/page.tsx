import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherForm } from "@/components/dashboard/roles/super-admin/teacher/TeacherForm";
import { api } from "@/trpc/server"; // Use server-side TRPC client

export default async function EditTeacherPage({
	params
}: {
	params: { id: string; role: string }
}) {
	// Fetch initial data server-side
	const teacher = await api.teacher.getById.query(params.id);
	const subjects = await api.subject.searchSubjects.query({});
	const classes = await api.class.searchClasses.query({});
		
	if (!teacher) {
		return <div>Loading...</div>;
	}

	const formattedTeacher = {
		id: teacher.id,
		name: teacher.name || '',
		email: teacher.email || '',
		phoneNumber: teacher.phoneNumber || '',
		status: teacher.status,
		teacherProfile: {
			teacherType: teacher.teacherProfile?.teacherType ?? null,
			specialization: teacher.teacherProfile?.specialization || '',
			availability: teacher.teacherProfile?.availability || '',
			subjects: teacher.teacherProfile?.subjects || [],
			classes: teacher.teacherProfile?.classes || [],
		}
	};

	return (
		<div className="container mx-auto py-6">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Edit Teacher</CardTitle>
				</CardHeader>
				<CardContent>
					<TeacherForm
						initialData={formattedTeacher}
						teacherId={params.id}
						subjects={subjects || []}
						classes={classes || []}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
