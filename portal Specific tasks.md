I'll provide detailed instructions for updating each form to include campus associations in the super admin UI:

1. Update Form Schemas:
```typescript
// Add to each form's schema (ProgramForm, ClassGroupForm, TeacherForm, StudentForm):
const formSchema = z.object({
  // ... existing fields
  campusId: z.string().min(1, "Campus is required"),
  // For entities that can be associated with multiple campuses
  campusIds: z.array(z.string()).min(1, "At least one campus must be selected"),
});
```

2. Update Form Interfaces:
```typescript
interface FormProps {
  // ... existing props
  campuses: {
    id: string;
    name: string;
    code: string;
  }[];
}
```

3. Specific Updates Per Component:

A. ProgramForm:
```typescript
// Add campus selection field
<FormField
  control={form.control}
  name="campusId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Campus</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <SelectTrigger>
          <SelectValue placeholder="Select Campus" />
        </SelectTrigger>
        <SelectContent>
          {campuses.map((campus) => (
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
```

B. ClassGroupForm:
```typescript
// Add to FormData interface
interface FormData {
  // ... existing fields
  campusId: string;
}

// Add campus selection field similar to ProgramForm
// Update mutation:
const createClassGroup = api.classGroup.create.useMutation({
  onSuccess: () => {
    // ... existing success handling
  },
});
```

C. TeacherForm:
```typescript
// Add multi-campus selection using MultiSelect component
<FormField
  control={form.control}
  name="campusIds"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Assigned Campuses</FormLabel>
      <MultiSelect
        selected={field.value}
        options={campuses.map(c => ({ value: c.id, label: c.name }))}
        onChange={(values) => field.onChange(values)}
        placeholder="Select Campuses"
      />
      <FormMessage />
    </FormItem>
  )}
/>
```

D. StudentForm:
```typescript
// Add campus association based on selected class
// Update form submission to include campus data
const onSubmit = async (data: FormValues) => {
  try {
    const selectedClass = classes.find(c => c.id === data.classId);
    const campusId = selectedClass?.campusId;
    
    await createStudent.mutateAsync({
      ...data,
      campusId
    });
  } catch (error) {
    // Error handling
  }
};
```

4. API Updates:

```typescript
// Update mutation endpoints to include campus data
const createMutation = api.entity.create.useMutation({
  onSuccess: () => {
    utils.entity.invalidate();
    onSuccess?.();
  },
});

// Update query to fetch campus-specific data
const { data: entities } = api.entity.getAll.useQuery({
  campusId: selectedCampusId
});
```

5. Management Component Updates:

```typescript
// Add campus filter to list views
const CampusFilter = () => {
  return (
    <Select
      value={selectedCampusId}
      onValueChange={(value) => setSelectedCampusId(value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Filter by Campus" />
      </SelectTrigger>
      <SelectContent>
        {campuses.map((campus) => (
          <SelectItem key={campus.id} value={campus.id}>
            {campus.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
```

6. Implementation Steps:

1. Update database schema to include campus relations
2. Modify API endpoints to handle campus associations
3. Update form components with campus fields
4. Add campus filtering to list views
5. Update create/edit mutations to include campus data
6. Add validation for campus requirements
7. Update UI to display campus information
8. Add campus-specific data loading logic

7. Testing Checklist:

- Verify campus selection works in all forms
- Test create/edit operations with campus associations
- Validate campus filtering functionality
- Check data persistence for campus associations
- Test multi-campus selection where applicable
- Verify campus-specific data loading
- Test validation rules for campus fields

Based on the provided codebase, I'll generate detailed instructions for implementing campus associations across class groups, teachers, and students, following the pattern established in the ClassForm component.

1. Update ClassGroupForm:
```typescript
// Add to formSchema
const formSchema = z.object({
  // existing fields...
  campusId: z.string().min(1, "Campus is required"),
});

// Update form interface
interface ClassGroupFormProps {
  // existing props...
  campuses: {
    id: string;
    name: string;
  }[];
}

// Add campus selection field
<FormField
  control={form.control}
  name="campusId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Campus</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select campus" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {campuses.map((campus) => (
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
```

2. Update TeacherForm:
```typescript
// Add to formSchema
const formSchema = z.object({
  // existing fields...
  campusIds: z.array(z.string()).min(1, "At least one campus must be selected"),
});

// Add to TeacherFormProps
interface TeacherFormProps {
  // existing props...
  campuses: {
    id: string;
    name: string;
  }[];
}

// Add multi-campus selection
<FormField
  control={form.control}
  name="campusIds"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Assigned Campuses</FormLabel>
      <div className="flex flex-wrap gap-2">
        {campuses.map((campus) => (
          <div
            key={campus.id}
            className={`cursor-pointer rounded-md px-3 py-1 text-sm ${
              field.value?.includes(campus.id)
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary'
            }`}
            onClick={() => {
              const currentValues = field.value || [];
              const newValues = currentValues.includes(campus.id)
                ? currentValues.filter((v) => v !== campus.id)
                : [...currentValues, campus.id];
              field.onChange(newValues);
            }}
          >
            {campus.name}
          </div>
        ))}
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

3. Update StudentForm:
```typescript
// Add to formSchema
const formSchema = z.object({
  // existing fields...
  campusId: z.string().min(1, "Campus is required"),
});

// Update form interface
interface StudentFormProps {
  // existing props...
  campuses: {
    id: string;
    name: string;
  }[];
}

// Add campus selection (inherited from class)
<FormField
  control={form.control}
  name="campusId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Campus</FormLabel>
      <Select 
        onValueChange={field.onChange} 
        value={field.value}
        disabled={true} // Campus is inherited from selected class
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Inherited from class" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {campuses.map((campus) => (
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
```

4. Update Management Components:

```typescript
// Add campus filter to list views
const CampusFilter = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Filter by Campus" />
      </SelectTrigger>
      <SelectContent>
        {campuses.map((campus) => (
          <SelectItem key={campus.id} value={campus.id}>
            {campus.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Add to list components
const [selectedCampusId, setSelectedCampusId] = useState<string>("");

// Update queries to include campus filter
const { data: entities } = api.entity.getAll.useQuery({
  campusId: selectedCampusId || undefined
});
```

5. Implementation Steps:

1. Database Schema Updates:
```prisma
model ClassGroup {
  id        String   @id @default(cuid())
  campusId  String
  campus    Campus   @relation(fields: [campusId], references: [id])
  // ... other fields
}

model Teacher {
  id        String   @id @default(cuid())
  campuses  CampusTeacher[]
  // ... other fields
}

model CampusTeacher {
  campusId   String
  teacherId  String
  campus     Campus   @relation(fields: [campusId], references: [id])
  teacher    Teacher  @relation(fields: [teacherId], references: [id])
  @@id([campusId, teacherId])
}

model Student {
  id        String   @id @default(cuid())
  campusId  String
  campus    Campus   @relation(fields: [campusId], references: [id])
  // ... other fields
}
```

2. API Updates:
```typescript
// Update mutations to handle campus associations
const createClassGroup = api.classGroup.create.useMutation({
  // ... existing config
  onMutate: async (variables) => {
    // Include campus validation
    if (!variables.campusId) {
      throw new Error("Campus is required");
    }
  }
});

const createTeacher = api.teacher.create.useMutation({
  // ... existing config
  onMutate: async (variables) => {
    // Include campus validation
    if (!variables.campusIds?.length) {
      throw new Error("At least one campus must be selected");
    }
  }
});
```

3. Testing Checklist:
- Verify campus selection works in all forms
- Test create/edit operations with campus associations
- Validate campus filtering functionality
- Check data persistence for campus associations
- Test multi-campus selection for teachers
- Verify campus inheritance for students from classes
- Test campus-specific data loading
- Verify permissions and access control

These updates will ensure proper campus association management across all entities while maintaining data consistency and user experience.