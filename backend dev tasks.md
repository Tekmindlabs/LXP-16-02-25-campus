Based on the provided codebase and requirements, let me analyze what's done and what needs to be implemented:

CURRENT STATUS:

1. Basic Structure Implemented:
- Campus Management (CampusManagement.tsx, CampusForm.tsx, CampusList.tsx)
- Classroom Management (ClassroomManagement.tsx, ClassroomForm.tsx, ClassroomView.tsx)
- Class Management (ClassManagement.tsx, ClassList.tsx)

2. Existing Features:
- Basic CRUD operations for campuses and classrooms
- Simple resource management for classrooms
- Basic scheduling system
- Attendance tracking
- Role-based access control

WHAT NEEDS TO BE DONE:

1. Database Schema Updates:
```prisma
model Building {
  id          String      @id @default(cuid())
  name        String
  code        String      @unique
  campusId    String
  campus      Campus      @relation(fields: [campusId], references: [id])
  floors      Floor[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Floor {
  id          String      @id @default(cuid())
  number      Int
  buildingId  String
  building    Building    @relation(fields: [buildingId], references: [id])
  wings       Wing[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Wing {
  id          String      @id @default(cuid())
  name        String
  floorId     String
  floor       Floor       @relation(fields: [floorId], references: [id])
  rooms       Room[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Room {
  id          String      @id @default(cuid())
  number      String
  wingId      String
  wing        Wing        @relation(fields: [wingId], references: [id])
  type        RoomType
  capacity    Int
  status      RoomStatus
  resources   Json?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum RoomType {
  CLASSROOM
  LAB
  ACTIVITY_ROOM
  LECTURE_HALL
}

enum RoomStatus {
  ACTIVE
  MAINTENANCE
  INACTIVE
}
```

2. API Implementation:

```typescript
// src/server/api/routers/building.ts
export const buildingRouter = createTRPCRouter({
  create: protectedProcedure
    .input(buildingSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
  
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      // Implementation
    }),
  
  // Additional endpoints
});

// Similar routers for Floor, Wing, and enhanced Room management
```

3. New Components Required:

```typescript
// src/components/dashboard/building/BuildingManagement.tsx
export const BuildingManagement: FC = () => {
  // Implementation
};

// src/components/dashboard/building/BuildingForm.tsx
export const BuildingForm: FC<BuildingFormProps> = () => {
  // Implementation
};

// Similar components for Floor and Wing management
```

4. Enhanced Classroom Form:

```typescript
// src/components/dashboard/classroom/EnhancedClassroomForm.tsx
export const EnhancedClassroomForm: FC<ClassroomFormProps> = ({
  isOpen,
  onClose,
  classroomId,
}) => {
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedFloor, setSelectedFloor] = useState<string>("");
  const [selectedWing, setSelectedWing] = useState<string>("");
  
  // Form implementation with new fields
};
```

5. Implementation Steps:

a. Database Migration:
```bash
# Generate migration
npx prisma generate
npx prisma migrate dev --name add_building_structure

# Apply migration
npx prisma migrate deploy
```

b. API Layer:
- Implement new routers
- Update existing classroom router
- Add validation schemas
- Implement error handling

c. Frontend Components:
- Create new management components
- Update existing forms
- Implement hierarchical selectors
- Add validation

d. Integration:
- Update classroom scheduling
- Enhance resource management
- Update reporting system

6. Testing Plan:

```typescript
// src/__tests__/building/BuildingManagement.test.tsx
describe('BuildingManagement', () => {
  it('should create new building', () => {
    // Test implementation
  });
  
  // Additional tests
});
```

7. Documentation:

```markdown
# Building Management

## Overview
The building management system provides a hierarchical structure for organizing physical spaces within a campus.

## Components
- Building Management
- Floor Management
- Wing Management
- Enhanced Room Management

## Usage
[Documentation details]

8. Integration Features and Performance Optimizations:

a. Classroom Scheduling Integration:
```typescript
// src/server/services/RoomSchedulingService.ts
export class RoomSchedulingService {
  // Room availability checking
  async checkRoomAvailability(roomId: string, startTime: DateTime, endTime: DateTime): Promise<boolean>;
  
  // Conflict detection
  async detectScheduleConflicts(scheduleRequest: ScheduleRequest): Promise<Conflict[]>;
  
  // Batch scheduling operations
  async batchScheduleRooms(requests: ScheduleRequest[]): Promise<ScheduleResult[]>;
}
```

b. Enhanced Resource Management:
```typescript
// src/server/services/RoomResourceService.ts
export class RoomResourceService {
  // Resource tracking and management
  async updateRoomResources(roomId: string, resources: ResourceUpdate[]): Promise<void>;
  
  // Resource availability checking
  async checkResourceAvailability(resourceType: string, quantity: number): Promise<AvailabilityResult>;
  
  // Resource allocation and deallocation
  async allocateResources(request: ResourceAllocationRequest): Promise<AllocationResult>;
}

// Resource types and validation
const resourceSchema = z.object({
  type: z.enum(['PROJECTOR', 'COMPUTER', 'WHITEBOARD', 'AUDIO_SYSTEM']),
  quantity: z.number().min(1),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE']),
  metadata: z.record(z.string(), z.any()).optional(),
});
```

c. Reporting System Integration:
```typescript
// src/server/services/RoomReportingService.ts
export class RoomReportingService {
  // Usage analytics
  async generateUsageReport(timeRange: DateRange): Promise<UsageReport>;
  
  // Resource utilization
  async generateResourceUtilizationReport(roomId: string): Promise<UtilizationReport>;
  
  // Maintenance scheduling
  async generateMaintenanceReport(): Promise<MaintenanceReport>;
}
```

d. Performance Optimizations:

1. Batch Operations:
```typescript
// src/server/api/routers/room.ts
export const roomRouter = createTRPCRouter({
  batchCreate: protectedProcedure
    .input(z.array(roomSchema))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(
        input.map(room => ctx.prisma.room.create({ data: room }))
      );
    }),

  batchUpdate: protectedProcedure
    .input(z.array(updateRoomSchema))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(
        input.map(({ id, data }) => 
          ctx.prisma.room.update({ where: { id }, data })
        )
      );
    }),
});
```

2. Caching Implementation:
```typescript
// src/lib/cache/RoomCache.ts
export class RoomCache {
  private cache: Map<string, CachedRoom>;
  private readonly ttl: number;

  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  async get(roomId: string): Promise<CachedRoom | null>;
  async set(roomId: string, room: Room): Promise<void>;
  async invalidate(roomId: string): Promise<void>;
}

// Implementation in room router
export const roomRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(roomIdSchema)
    .query(async ({ ctx, input }) => {
      // Check cache first
      const cached = await ctx.roomCache.get(input.id);
      if (cached) return cached;

      // If not in cache, fetch from database
      const room = await ctx.prisma.room.findUnique({
        where: { id: input.id },
        include: { /* relations */ },
      });

      // Cache the result
      if (room) await ctx.roomCache.set(input.id, room);
      return room;
    }),
});
```

e. API Endpoints for Integration:
```typescript
// src/server/api/routers/room.ts
export const roomRouter = createTRPCRouter({
  // Scheduling endpoints
  getAvailability: protectedProcedure
    .input(availabilitySchema)
    .query(async ({ ctx, input }) => {
      return ctx.roomSchedulingService.checkRoomAvailability(input);
    }),

  // Resource management endpoints
  updateResources: protectedProcedure
    .input(resourceUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.roomResourceService.updateRoomResources(input);
    }),

  // Reporting endpoints
  generateReport: protectedProcedure
    .input(reportRequestSchema)
    .query(async ({ ctx, input }) => {
      return ctx.roomReportingService.generateReport(input);
    }),
});
```

f. Implementation Priority:
1. Room Scheduling Integration
   - Basic availability checking
   - Conflict detection
   - Schedule management

2. Resource Management
   - Resource tracking
   - Availability management
   - Allocation system

3. Reporting System
   - Usage analytics
   - Resource utilization
   - Maintenance tracking

4. Performance Optimizations
   - Batch operations
   - Caching system
   - Query optimizations

