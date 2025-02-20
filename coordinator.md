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


Based on the provided code and schema, I'll review the program coordinator management implementation and suggest any necessary changes or improvements:

1. Coordinator Profile Model:
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
  responsibilityRecords CoordinatorResponsibility[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

2. Program-Coordinator Relationship:
```prisma
model Program {
  coordinator      CoordinatorProfile?    @relation(fields: [coordinatorId], references: [id])
  coordinatorId    String?
  // ... other fields
}
```

Key Observations and Recommendations:

1. Coordinator Types:
- The schema correctly defines different coordinator types (PROGRAM_COORDINATOR, CAMPUS_PROGRAM_COORDINATOR)
- Consider adding more specific coordinator types if needed

2. Responsibilities Management:
- Currently uses both String[] array and a separate CoordinatorResponsibility model
- Recommend standardizing to use only CoordinatorResponsibility model for better tracking

3. Missing Features:
- No coordinator history tracking
- No coordinator assignment audit logs
- No coordinator workload limits

4. Suggested Additions:

```prisma
// Add coordinator history tracking
model CoordinatorAssignmentHistory {
  id            String   @id @default(cuid())
  coordinatorId String
  programId     String
  assignedAt    DateTime @default(now())
  endedAt       DateTime?
  reason        String?
}

// Add coordinator workload settings
model CoordinatorWorkloadSettings {
  id                String @id @default(cuid())
  coordinatorId     String @unique
  maxPrograms       Int    @default(5)
  maxStudents       Int?
  workloadUnits     Float  @default(1.0)
}
```

5. Additional Relations:
- Add direct access to coordinator's students through programs
- Add reporting relationships between coordinators

6. Security and Permissions:
- Implement role-based access control for coordinator actions
- Add permission checks in coordinator-related operations

7. API Endpoints:
- Add validation for coordinator assignments
- Implement workload checking before assignment
- Add coordinator transfer functionality

These changes would create a more robust and maintainable coordinator management system. Would you like me to provide specific implementation details for any of these suggestions?


I'll help you implement the requested code changes for coordinator management. Let's break this down into sections:

1. First, let's update the schema to add the new relations:

```prisma
// Add to CoordinatorProfile model
model CoordinatorProfile {
  // ... existing fields ...
  
  // Add reporting relationships
  reportsTo         CoordinatorProfile?  @relation("CoordinatorHierarchy", fields: [reportsToId], references: [id])
  reportsToId       String?
  subordinates      CoordinatorProfile[] @relation("CoordinatorHierarchy")
  
  // Add direct access to students through programs
  students          StudentProfile[]     @relation("CoordinatorStudents")
  
  // Add workload tracking
  maxWorkload       Int                  @default(5) // Maximum number of programs
  currentWorkload   Int                  @default(0) // Current number of assigned programs
}
```

2. Update the coordinator router with new endpoints and security checks:

```typescript
// src/server/api/routers/coordinator.ts

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { hasPermission } from "@/utils/permissions";

export const coordinatorRouter = createTRPCRouter({
  // ... existing endpoints ...

  // Add new endpoint for coordinator transfer
  transferCoordinator: protectedProcedure
    .input(z.object({
      programId: z.string(),
      fromCoordinatorId: z.string(),
      toCoordinatorId: z.string(),
      transferNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!hasPermission(ctx.session, "MANAGE_COORDINATORS")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to transfer coordinators",
        });
      }

      // Check workload of receiving coordinator
      const toCoordinator = await ctx.prisma.coordinatorProfile.findUnique({
        where: { id: input.toCoordinatorId },
        include: { programs: true },
      });

      if (!toCoordinator) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Receiving coordinator not found",
        });
      }

      if (toCoordinator.currentWorkload >= toCoordinator.maxWorkload) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Receiving coordinator has reached maximum workload",
        });
      }

      // Perform transfer
      const [removedProgram, addedProgram] = await ctx.prisma.$transaction([
        ctx.prisma.program.update({
          where: { id: input.programId },
          data: { coordinatorId: null },
        }),
        ctx.prisma.program.update({
          where: { id: input.programId },
          data: { coordinatorId: input.toCoordinatorId },
        }),
      ]);

      // Update workload counts
      await ctx.prisma.$transaction([
        ctx.prisma.coordinatorProfile.update({
          where: { id: input.fromCoordinatorId },
          data: { currentWorkload: { decrement: 1 } },
        }),
        ctx.prisma.coordinatorProfile.update({
          where: { id: input.toCoordinatorId },
          data: { currentWorkload: { increment: 1 } },
        }),
      ]);

      return { success: true };
    }),

  // Add endpoint to get coordinator's students
  getCoordinatorStudents: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (!hasPermission(ctx.session, "VIEW_COORDINATOR_STUDENTS")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view coordinator students",
        });
      }

      return ctx.prisma.studentProfile.findMany({
        where: {
          class: {
            classGroup: {
              program: {
                coordinatorId: input,
              },
            },
          },
        },
        include: {
          user: true,
          class: {
            include: {
              classGroup: true,
            },
          },
        },
      });
    }),

  // Add endpoint to manage reporting relationships
  updateReportingRelationship: protectedProcedure
    .input(z.object({
      coordinatorId: z.string(),
      reportsToId: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!hasPermission(ctx.session, "MANAGE_COORDINATOR_HIERARCHY")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to manage coordinator hierarchy",
        });
      }

      return ctx.prisma.coordinatorProfile.update({
        where: { id: input.coordinatorId },
        data: { reportsToId: input.reportsToId },
      });
    }),
});
```

3. Add permission utilities:

```typescript
// src/utils/permissions.ts

export const COORDINATOR_PERMISSIONS = {
  MANAGE_COORDINATORS: "MANAGE_COORDINATORS",
  VIEW_COORDINATOR_STUDENTS: "VIEW_COORDINATOR_STUDENTS",
  MANAGE_COORDINATOR_HIERARCHY: "MANAGE_COORDINATOR_HIERARCHY",
  ASSIGN_PROGRAMS: "ASSIGN_PROGRAMS",
} as const;

export function hasPermission(session: Session | null, permission: keyof typeof COORDINATOR_PERMISSIONS): boolean {
  if (!session?.user?.role) return false;
  
  // Add your permission checking logic here based on your role system
  const permissionMap = {
    SUPER_ADMIN: Object.values(COORDINATOR_PERMISSIONS),
    ADMIN: [
      COORDINATOR_PERMISSIONS.VIEW_COORDINATOR_STUDENTS,
      COORDINATOR_PERMISSIONS.ASSIGN_PROGRAMS,
    ],
    // Add other roles as needed
  };

  return permissionMap[session.user.role]?.includes(permission) ?? false;
}
```

4. Update the CoordinatorForm component to include workload validation:

```typescript
// src/components/dashboard/roles/super-admin/coordinator/CoordinatorForm.tsx

// Add to existing imports
import { useToast } from "@/hooks/use-toast";

// Add to form validation schema
const formSchema = z.object({
  // ... existing fields ...
  maxWorkload: z.number().min(1, "Minimum workload must be 1"),
});

// Add to form component
export const CoordinatorForm = ({ /* existing props */ }) => {
  const toast = useToast();

  // Add to form submission
  const onSubmit = async (values: FormValues) => {
    try {
      // Check workload before assignment
      if (values.programIds.length > values.maxWorkload) {
        toast({
          title: "Error",
          description: `Cannot assign more than ${values.maxWorkload} programs to this coordinator`,
          variant: "destructive",
        });
        return;
      }

      // Existing submission logic...
    } catch (error) {
      // Error handling...
    }
  };

  // Add workload field to form
  return (
    <Form {...form}>
      {/* Existing form fields */}
      <FormField
        control={form.control}
        name="maxWorkload"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maximum Program Workload</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
};
```

5. Add a new component for coordinator transfer:

```typescript
// src/components/dashboard/roles/super-admin/coordinator/CoordinatorTransfer.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

interface CoordinatorTransferProps {
  programId: string;
  currentCoordinatorId: string;
}

export const CoordinatorTransfer = ({
  programId,
  currentCoordinatorId,
}: CoordinatorTransferProps) => {
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const toast = useToast();

  const { data: availableCoordinators } = api.coordinator.searchCoordinators.useQuery({
    status: "ACTIVE",
  });

  const transferMutation = api.coordinator.transferCoordinator.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Program transferred successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTransfer = async () => {
    if (!selectedCoordinatorId) {
      toast({
        title: "Error",
        description: "Please select a coordinator to transfer to",
        variant: "destructive",
      });
      return;
    }

    await transferMutation.mutateAsync({
      programId,
      fromCoordinatorId: currentCoordinatorId,
      toCoordinatorId: selectedCoordinatorId,
      transferNotes,
    });
  };

  return (
    <div className="space-y-4">
      <Select
        value={selectedCoordinatorId}
        onValueChange={setSelectedCoordinatorId}
        options={availableCoordinators?.map(c => ({
          value: c.id,
          label: c.name,
        }))}
        placeholder="Select new coordinator"
      />
      <Input
        placeholder="Transfer notes"
        value={transferNotes}
        onChange={(e) => setTransferNotes(e.target.value)}
      />
      <Button
        onClick={handleTransfer}
        disabled={transferMutation.isLoading}
      >
        Transfer Program
      </Button>
    </div>
  );
};
```

These changes implement:
- Direct access to coordinator's students through programs
- Reporting relationships between coordinators
- Role-based access control for coordinator actions
- Permission checks in coordinator operations
- Validation for coordinator assignments
- Workload checking before assignment
- Coordinator transfer functionality

Make sure to:
1. Run prisma migrate to apply schema changes
2. Update your permission system to include the new coordinator permissions
3. Add appropriate error handling and loading states
4. Add tests for the new functionality
5. Update documentation to reflect these changes

Would you like me to provide any additional details or clarification for any of these changes?