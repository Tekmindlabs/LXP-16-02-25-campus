Based on the codebase and requirements, let me propose a refined implementation for centralizing activities while maintaining the distinction between curriculum and class activities:

1. **Enhanced Activity Type Structure**:
```typescript
// Update in class-activity.ts
export enum ActivityScope {
  CURRICULUM = 'CURRICULUM',
  CLASS = 'CLASS'
}

export interface UnifiedActivity extends ClassActivity {
  // Existing fields from ClassActivity
  id: string;
  title: string;
  description?: string;
  type: ActivityType;
  status: ActivityStatus;
  configuration: ActivityConfiguration;
  
  // New fields for unified management
  scope: ActivityScope;
  subjectId: string;
  classId?: string; // Optional for curriculum activities
  isTemplate: boolean;
  
  // Curriculum specific fields
  curriculumNodeId?: string;
  
  // Existing fields
  resources?: ActivityResource[];
  submissions?: ActivitySubmission[];
}
```

2. **Updated Activity Service**:
```typescript
class ActivityService {
  constructor(
    private readonly db: PrismaClient,
    private readonly gradeBookService: GradeBookService
  ) {}

  async createActivity(data: CreateActivityInput) {
    const activity = await this.db.classActivity.create({
      data: {
        ...data,
        scope: data.curriculumNodeId ? ActivityScope.CURRICULUM : ActivityScope.CLASS,
        isTemplate: data.isTemplate || false,
        status: ActivityStatus.DRAFT
      }
    });

    // If it's a curriculum activity, create inheritance records for all classes
    if (data.curriculumNodeId) {
      await this.createCurriculumInheritance(activity.id, data.subjectId);
    }

    return activity;
  }

  private async createCurriculumInheritance(activityId: string, subjectId: string) {
    // Get all classes with this subject
    const classes = await this.db.class.findMany({
      where: { subjects: { some: { id: subjectId } } }
    });

    // Create inheritance records
    await this.db.activityInheritance.createMany({
      data: classes.map(cls => ({
        activityId,
        classId: cls.id,
        inherited: true
      }))
    });
  }

  async getActivities(filters: {
    subjectId?: string;
    classId?: string;
    curriculumNodeId?: string;
    scope?: ActivityScope;
    isTemplate?: boolean;
  }) {
    return this.db.classActivity.findMany({
      where: {
        ...filters,
        OR: [
          { ...filters },
          {
            activityInheritance: {
              some: { classId: filters.classId }
            }
          }
        ]
      },
      include: {
        subject: true,
        class: true,
        curriculumNode: true,
        resources: true
      }
    });
  }
}
```

3. **Updated Activity Management Component**:
```typescript
export function UnifiedActivityManager({
  subjectId,
  classId,
  curriculumNodeId
}: {
  subjectId: string;
  classId?: string;
  curriculumNodeId?: string;
}) {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'form'>('list');

  const { data: activities } = api.activity.getAll.useQuery({
    subjectId,
    classId,
    curriculumNodeId
  });

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2>Activities</h2>
        <div className="space-x-2">
          {classId && (
            <Button onClick={() => setView('templates')}>
              Browse Templates
            </Button>
          )}
          <Button onClick={() => setView('form')}>
            Create Activity
          </Button>
        </div>
      </div>

      {view === 'list' && (
        <ActivityList
          activities={activities}
          onEdit={setSelectedActivity}
          scope={classId ? ActivityScope.CLASS : ActivityScope.CURRICULUM}
        />
      )}

      {view === 'form' && (
        <ActivityForm
          activityId={selectedActivity}
          subjectId={subjectId}
          classId={classId}
          curriculumNodeId={curriculumNodeId}
          onClose={() => {
            setSelectedActivity(null);
            setView('list');
          }}
        />
      )}

      {view === 'templates' && (
        <ActivityTemplates
          subjectId={subjectId}
          onSelect={(templateId) => {
            // Clone template for class
          }}
        />
      )}
    </div>
  );
}
```

4. **Activity Templates Management**:
```typescript
export function ActivityTemplates({
  subjectId,
  onSelect
}: {
  subjectId: string;
  onSelect: (templateId: string) => void;
}) {
  const { data: templates } = api.activity.getAll.useQuery({
    subjectId,
    isTemplate: true
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      {templates?.map(template => (
        <Card key={template.id}>
          <CardHeader>
            <CardTitle>{template.title}</CardTitle>
            <CardDescription>{template.type}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => onSelect(template.id)}>
              Use Template
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
```

5. **Database Schema Updates** (in schema.prisma):
```prisma
model Activity {
  id              String   @id @default(cuid())
  title           String
  description     String?
  type            ActivityType
  status          ActivityStatus
  scope           ActivityScope
  isTemplate      Boolean @default(false)
  
  // Relations
  subject         Subject     @relation(fields: [subjectId], references: [id])
  subjectId       String
  class           Class?      @relation(fields: [classId], references: [id])
  classId         String?
  curriculumNode  CurriculumNode? @relation(fields: [curriculumNodeId], references: [id])
  curriculumNodeId String?
  
  // Inheritance
  inheritedBy     ActivityInheritance[]
  
  // Configuration
  configuration   Json
  resources       ActivityResource[]
  submissions     ActivitySubmission[]
}

model ActivityInheritance {
  activity        Activity @relation(fields: [activityId], references: [id])
  activityId      String
  class           Class    @relation(fields: [classId], references: [id])
  classId         String
  inherited       Boolean  @default(true)
  
  @@id([activityId, classId])
}
```

This implementation:
1. Maintains clear separation between curriculum and class activities while using a unified structure
2. Supports activity inheritance from curriculum to classes
3. Enables activity templating for reuse
4. Provides flexible filtering and management
5. Maintains existing functionality while adding new capabilities
6. Scales well for future enhancements

here's how to integrate the centralized activity management into the SubjectView Curriculum Manager:

    Update CurriculumManager Component:

typescript

// In CurriculumManager.tsx

export function CurriculumManager({ subjectId }: { subjectId: string }) {

  const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);

  const [activeView, setActiveView] = useState<'content' | 'resources' | 'activities'>('content');

  const [showNodeEditor, setShowNodeEditor] = useState(false);

  const [isSheetOpen, setIsSheetOpen] = useState(false);


  const { data: nodes } = api.curriculum.getNodes.useQuery({ subjectId });


  return (

    <div className="grid grid-cols-12 gap-4">

      {/* Mobile Sheet for Curriculum Tree */}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>

        <SheetTrigger asChild className="lg:hidden">

          <Button variant="outline">View Curriculum Tree</Button>

        </SheetTrigger>

        <SheetContent side="left" className="w-[300px] sm:w-[400px]">

          <CurriculumTree

            subjectId={subjectId}

            onNodeSelect={(node) => {

              setSelectedNode(node);

              setIsSheetOpen(false);

            }}

          />

        </SheetContent>

      </Sheet>


      {/* Desktop Curriculum Tree */}

      <div className="hidden lg:block col-span-3">

        <CurriculumTree

          subjectId={subjectId}

          onNodeSelect={setSelectedNode}

        />

      </div>


      {/* Content Area */}

      <div className="col-span-12 lg:col-span-9">

        {selectedNode ? (

          <>

            <div className="flex justify-between items-center mb-4">

              <div className="flex items-center gap-2">

                <Button

                  variant="ghost"

                  onClick={() => setSelectedNode(null)}

                >

                  <ArrowLeft className="w-4 h-4 mr-2" />

                  Back

                </Button>

                <h2 className="text-2xl font-bold">{selectedNode.title}</h2>

              </div>

              <Button onClick={() => setShowNodeEditor(true)}>

                Edit Node

              </Button>

            </div>


            <div className="mb-6">

              <Tabs defaultValue={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>

                <TabsList>

                  <TabsTrigger value="content">Content</TabsTrigger>

                  <TabsTrigger value="resources">Resources</TabsTrigger>

                  <TabsTrigger value="activities">Activities</TabsTrigger>

                </TabsList>

                <TabsContent value="content">

                  <NodeContent node={selectedNode} />

                </TabsContent>

                <TabsContent value="resources">

                  <ResourceManager nodeId={selectedNode.id} />

                </TabsContent>

                <TabsContent value="activities">

                  <UnifiedActivityManager

                    subjectId={subjectId}

                    curriculumNodeId={selectedNode.id}

                    scope={ActivityScope.CURRICULUM}

                  />

                </TabsContent>

              </Tabs>

            </div>

          </>

        ) : (

          renderContent()

        )}

      </div>


      {/* Node Editor Dialog */}

      <Dialog open={showNodeEditor} onOpenChange={setShowNodeEditor}>

        <DialogContent>

          <NodeEditor

            node={selectedNode}

            onClose={() => setShowNodeEditor(false)}

          />

        </DialogContent>

      </Dialog>

    </div>

  );

}

    Create ActivityList Component for Curriculum View:

typescript

// In components/dashboard/roles/super-admin/subject/curriculum/ActivityList.tsx

export function ActivityList({

  activities,

  onEdit,

  scope

}: {

  activities?: UnifiedActivity[];

  onEdit: (id: string) => void;

  scope: ActivityScope;

}) {

  return (

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      {activities?.map(activity => (

        <Card key={activity.id}>

          <CardHeader>

            <CardTitle>{activity.title}</CardTitle>

            <CardDescription>{activity.type}</CardDescription>

          </CardHeader>

          <CardContent>

            <p className="text-sm text-gray-500">

              {activity.description}

            </p>

          </CardContent>

          <CardFooter className="flex justify-between">

            <Button

              variant="outline"

              size="sm"

              onClick={() => onEdit(activity.id)}

            >

              Edit

            </Button>

            {scope === ActivityScope.CURRICULUM && (

              <Badge>Curriculum</Badge>

            )}

          </CardFooter>

        </Card>

      ))}

    </div>

  );

}

    Update Activity Form for Curriculum Context:

typescript

// In components/dashboard/roles/super-admin/subject/curriculum/ActivityForm.tsx

export function ActivityForm({

  activityId,

  subjectId,

  curriculumNodeId,

  onClose

}: {

  activityId?: string;

  subjectId: string;

  curriculumNodeId: string;

  onClose: () => void;

}) {

  const form = useForm<FormData>({

    resolver: zodResolver(activitySchema),

    defaultValues: {

      title: '',

      description: '',

      type: ActivityType.QUIZ_MULTIPLE_CHOICE,

      subjectId,

      curriculumNodeId,

      scope: ActivityScope.CURRICULUM,

      isTemplate: true,

      configuration: {

        activityMode: ActivityMode.ONLINE,

        isGraded: false,

        totalMarks: 0,

        passingMarks: 0,

        gradingType: ActivityGradingType.AUTOMATIC,

        availabilityDate: new Date(),

        deadline: new Date(),

        viewType: ActivityViewType.PREVIEW

      }

    }

  });


  const { mutate: createActivity } = api.activity.create.useMutation({

    onSuccess: () => {

      toast.success('Activity created successfully');

      onClose();

    },

    onError: (error) => {

      toast.error(error.message);

    }

  });


  const onSubmit = (data: FormData) => {

    createActivity(data);

  };


  return (

    <Form {...form}>

      <form onSubmit={form.handleSubmit(onSubmit)}>

        {/* Form fields */}

        <FormField

          control={form.control}

          name="title"

          render={({ field }) => (

            <FormItem>

              <FormLabel>Title</FormLabel>

              <FormControl>

                <Input {...field} />

              </FormControl>

            </FormItem>

          )}

        />

        {/* Add other form fields */}

        <div className="flex justify-end gap-2 mt-4">

          <Button type="button" variant="outline" onClick={onClose}>

            Cancel

          </Button>

          <Button type="submit">

            Create Activity

          </Button>

        </div>

      </form>

    </Form>

  );

}

This integration:

    Uses the unified activity structure within the curriculum context
    Maintains separation of concerns while sharing core functionality
    Provides a consistent user experience across the application
    Enables curriculum activities to be used as templates for class activities
    Supports the inheritance model for curriculum activities

The key changes are:

    Integration of UnifiedActivityManager in the curriculum view
    Addition of scope-aware components for activity management
    Unified form handling for both curriculum and class activities
    Consistent styling and user interface patterns

Would you like me to elaborate on any specific aspect of this integration?
