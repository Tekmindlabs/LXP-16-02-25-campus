Based on the codebase review and your request, I'll analyze the schema implications and potential technical debt issues:

1. Schema Analysis and Potential Conflicts:

```typescript
// Current Schema Issues to Address:

// 1. Coordinator Type Definition
enum CoordinatorType {
  PROGRAM_COORDINATOR
  CAMPUS_PROGRAM_COORDINATOR
}

Based on the provided code and changes to the coordinator form, I'll help outline the necessary updates needed for the coordinator management system. Here are the key changes required:

1. First, update the Coordinator interface in `CoordinatorList.tsx` and `CoordinatorManagement.tsx`:

```typescript
interface Coordinator {
  id: string;
  name: string;
  email: string;
  status: Status;
  type: 'PROGRAM_COORDINATOR' | 'CAMPUS_PROGRAM_COORDINATOR';
  coordinatorProfile: {
    programs: {
      id: string;
      name: string;
    }[];
    campus?: {
      id: string;
      name: string;
    };
    responsibilities: string[];
    inheritedPrograms?: {
      id: string;
      name: string;
    }[];
  };
}
```

2. Update the CoordinatorList component to display responsibilities:

```typescript
// In CoordinatorList.tsx
<TableHeader>
  <TableRow>
    <TableHead>Name</TableHead>
    <TableHead>Email</TableHead>
    <TableHead>Type</TableHead>
    <TableHead>Campus</TableHead>
    <TableHead>Programs</TableHead>
    <TableHead>Responsibilities</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Actions</TableHead>
  </TableRow>
</TableHeader>
<TableBody>
  {coordinators.map((coordinator) => (
    <TableRow key={coordinator.id}>
      {/* ... existing cells ... */}
      <TableCell>
        <div className="flex flex-wrap gap-2">
          {coordinator.coordinatorProfile.responsibilities.map((responsibility) => (
            <Badge key={responsibility} variant="outline">
              {responsibility}
            </Badge>
          ))}
        </div>
      </TableCell>
      {/* ... remaining cells ... */}
    </TableRow>
  ))}
</TableBody>
```

3. Update the CoordinatorManagement component to include additional filters:

```typescript
// In CoordinatorManagement.tsx
interface SearchFilters {
  search: string;
  programId?: string;
  campusId?: string;
  type?: 'PROGRAM_COORDINATOR' | 'CAMPUS_PROGRAM_COORDINATOR';
  status?: Status;
}

export const CoordinatorManagement = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
  });

  // Add campus filter
  <Select
    value={filters.campusId || "ALL"}
    onValueChange={(value) => setFilters({ ...filters, campusId: value === "ALL" ? undefined : value })}
  >
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Filter by Campus" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="ALL">All Campuses</SelectItem>
      {campuses.map((campus) => (
        <SelectItem key={campus.id} value={campus.id}>
          {campus.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  // Add coordinator type filter
  <Select
    value={filters.type || "ALL"}
    onValueChange={(value) => setFilters({ 
      ...filters, 
      type: value === "ALL" ? undefined : value as 'PROGRAM_COORDINATOR' | 'CAMPUS_PROGRAM_COORDINATOR' 
    })}
  >
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Filter by Type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="ALL">All Types</SelectItem>
      <SelectItem value="PROGRAM_COORDINATOR">Program Coordinator</SelectItem>
      <SelectItem value="CAMPUS_PROGRAM_COORDINATOR">Campus Program Coordinator</SelectItem>
    </SelectContent>
  </Select>
```

4. Update the CoordinatorForm props in CoordinatorManagement:

```typescript
<CoordinatorForm 
  selectedCoordinator={coordinators?.find(c => c.id === selectedCoordinatorId)}
  programs={programData?.programs?.map((program) => ({
    id: program.id,
    name: program.name || '',
    level: program.classGroups?.[0]?.name || 'Unknown',
    campuses: program.campuses // Add campuses data
  })) || []}
  campuses={campuses || []}
  onSuccess={() => setSelectedCoordinatorId(null)}
/>
```

5. Update the API schema and routes to handle the new coordinator structure:

```typescript
// In your API route file
export const coordinatorRouter = createTRPCRouter({
  searchCoordinators: publicProcedure
    .input(z.object({
      search: z.string(),
      programId: z.string().optional(),
      campusId: z.string().optional(),
      type: z.enum(['PROGRAM_COORDINATOR', 'CAMPUS_PROGRAM_COORDINATOR']).optional(),
      status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Update query to include new filters
      const coordinators = await ctx.db.coordinator.findMany({
        where: {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' } },
            { email: { contains: input.search, mode: 'insensitive' } },
          ],
          type: input.type,
          status: input.status,
          coordinatorProfile: {
            campusId: input.campusId,
            programs: input.programId ? {
              some: { id: input.programId }
            } : undefined,
          }
        },
        include: {
          coordinatorProfile: {
            include: {
              programs: true,
              campus: true,
              responsibilities: true,
            }
          }
        }
      });
      return coordinators;
    }),
});
```

These updates will ensure that the coordinator management system properly handles the new coordinator types, responsibilities, and campus-program relationships. Make sure to also update your database schema to reflect these changes if you haven't already done so.


Based on the provided codebase and migrations, I'll help outline the necessary schema updates to implement the coordinator changes and make them work with the existing system. Here's what needs to be updated in the Prisma schema:

1. First, update the CoordinatorProfile model:

```prisma
model CoordinatorProfile {
  id        String    @id @default(cuid())
  user      User      @relation(fields: [userId], references: [id])
  userId    String    @unique
  type      CoordinatorType @default(PROGRAM_COORDINATOR)
  programs  Program[]
  campus    Campus?   @relation(fields: [campusId], references: [id])
  campusId  String?
  responsibilities String[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@map("coordinator_profiles")
}

enum CoordinatorType {
  PROGRAM_COORDINATOR
  CAMPUS_PROGRAM_COORDINATOR
}
```

2. Update the Program model to support campus relationships:

```prisma
model Program {
  id               String                 @id @default(cuid())
  name             String?                @unique
  description      String?
  status           Status                 @default(ACTIVE)
  termSystem       TermSystemType         @default(SEMESTER)
  coordinator      CoordinatorProfile?    @relation(fields: [coordinatorId], references: [id])
  coordinatorId    String?
  calendar         Calendar               @relation(fields: [calendarId], references: [id])
  calendarId       String
  classGroups      ClassGroup[]
  termStructures   ProgramTermStructure[]
  assessmentSystem AssessmentSystem?
  campuses         Campus[]               @relation("ProgramCampuses")
  createdAt        DateTime               @default(now())
  updatedAt        DateTime               @updatedAt

  @@map("programs")
}
```

3. Add necessary indexes and relations:

```prisma
model Campus {
  // ... existing fields ...
  programs         Program[]    @relation("ProgramCampuses")
  coordinators     CoordinatorProfile[]
  
  @@index([id])
}
```

4. Update the User model to include coordinator type:

```prisma
model User {
  // ... existing fields ...
  coordinatorProfile   CoordinatorProfile?
  userType            UserType?
  
  @@index([id])
}

enum UserType {
  STUDENT
  TEACHER
  COORDINATOR
  PARENT
  ADMIN
}
```

5. Add a new model for tracking coordinator responsibilities:

```prisma
model CoordinatorResponsibility {
  id              String    @id @default(cuid())
  coordinator     CoordinatorProfile @relation(fields: [coordinatorId], references: [id])
  coordinatorId   String
  responsibility  String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([coordinatorId, responsibility])
  @@map("coordinator_responsibilities")
}
```

6. Add necessary migrations:

Create a new migration file that includes these changes:

```sql
-- CreateEnum
CREATE TYPE "CoordinatorType" AS ENUM ('PROGRAM_COORDINATOR', 'CAMPUS_PROGRAM_COORDINATOR');

-- AlterTable
ALTER TABLE "coordinator_profiles"
ADD COLUMN "type" "CoordinatorType" NOT NULL DEFAULT 'PROGRAM_COORDINATOR',
ADD COLUMN "campusId" TEXT,
ADD COLUMN "responsibilities" TEXT[];

-- AddForeignKey
ALTER TABLE "coordinator_profiles"
ADD CONSTRAINT "coordinator_profiles_campusId_fkey"
FOREIGN KEY ("campusId") REFERENCES "campuses"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "coordinator_profiles_campusId_idx" ON "coordinator_profiles"("campusId");
```

7. Update the schema version in schema.prisma:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

These changes will:
- Support both program and campus-specific coordinators
- Allow coordinators to be associated with specific campuses
- Track coordinator responsibilities
- Maintain relationships between programs, campuses, and coordinators
- Enable proper filtering and querying of coordinator data
- Support the new coordinator management features

After making these changes:
1. Run `prisma generate` to update the Prisma Client
2. Create and apply the new migration
3. Update any existing coordinator-related API routes to use the new schema
4. Update the frontend components to handle the new data structure

This schema update provides a solid foundation for the enhanced coordinator management system while maintaining compatibility with existing features and ensuring proper data relationships and constraints.