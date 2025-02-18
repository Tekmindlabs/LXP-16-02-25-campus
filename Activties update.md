Based on the codebase review and optimization recommendations, here's a detailed breakdown of required changes per file:

1. `/src/types/class-activity.ts`:
```typescript
// Add new base interfaces
interface BaseActivity {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  status: ActivityStatus;
  configuration: BaseConfiguration;
}

// Update configuration interface
interface BaseConfiguration {
  activityMode: ActivityMode;
  isGraded: boolean;
  adaptiveLearning?: {
    difficultyLevel: number;
    autoAdjust: boolean;
  };
  interactivity?: {
    realTimeCollaboration: boolean;
    peerReview: boolean;
  };
  analytics?: {
    trackingEnabled: boolean;
    metrics: string[];
  };
}

// Update existing interfaces
interface UnifiedActivity extends BaseActivity {
  scope: ActivityScope;
  isTemplate: boolean;
  curriculumNodeId?: string;
  classId?: string;
}
```

2. `/src/server/services/activity.service.ts`:
```typescript
class EnhancedActivityService {
  constructor(private db: PrismaClient) {}

  // Enhanced creation method
  async createActivity(data: ActivityInput): Promise<UnifiedActivity> {
    const baseActivity = await this.createBaseActivity(data);
    return data.scope === ActivityScope.CURRICULUM 
      ? this.extendForCurriculum(baseActivity)
      : this.extendForClass(baseActivity);
  }

  // Optimized query builder
  private buildOptimizedQuery(filters: ActivityFilters) {
    return {
      where: this.buildWhereClause(filters),
      include: this.getRelevantIncludes(filters),
      orderBy: { createdAt: 'desc' }
    };
  }

  // Implement caching
  private activityCache = new Map<string, UnifiedActivity>();
}
```

3. `/src/server/api/routers/class-activity.ts`:
```typescript
// Update validation schemas
const enhancedConfigSchema = configurationSchema.extend({
  adaptiveLearning: z.object({
    difficultyLevel: z.number(),
    autoAdjust: z.boolean()
  }).optional(),
  interactivity: z.object({
    realTimeCollaboration: z.boolean(),
    peerReview: z.boolean()
  }).optional(),
  analytics: z.object({
    trackingEnabled: z.boolean(),
    metrics: z.array(z.string())
  }).optional()
});

// Implement selective loading
const getActivityWithRelations = async (id: string, relations: string[]) => {
  const basic = await prisma.classActivity.findUnique({
    where: { id },
    select: { id: true, title: true, type: true }
  });

  if (!basic) return null;

  const additionalData = await Promise.all(
    relations.map(relation => loadRelation(basic.id, relation))
  );

  return { ...basic, ...Object.assign({}, ...additionalData) };
};
```

4. `/src/components/dashboard/roles/super-admin/class-activity/ClassActivityForm.tsx`:
```typescript
// Implement ActivityFormManager
const ActivityFormManager = {
  baseFields: ['title', 'description', 'type'],
  curriculumExtension: ['learningObjectives', 'prerequisites'],
  classExtension: ['deadline', 'classGroups'],

  validateCommon(data: any) {
    // Common validation logic
  },
  validateScope(data: any, scope: ActivityScope) {
    // Scope-specific validation
  }
};

// Update form component
const ClassActivityForm: React.FC<Props> = ({ activityId, onClose }) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: ActivityFormManager.getDefaultValues()
  });

  // Implement selective loading
  useEffect(() => {
    if (activityId) {
      loadActivityData(activityId).then(data => {
        form.reset(data);
      });
    }
  }, [activityId]);
};
```

5. Create new file `/src/utils/activity-cache.ts`:
```typescript
export const activityCache = {
  templates: new Map<string, UnifiedActivity>(),
  commonConfigs: new Map<string, BaseConfiguration>(),

  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    if (this.templates.has(key)) {
      return this.templates.get(key) as T;
    }

    const data = await fetchFn();
    this.templates.set(key, data as UnifiedActivity);
    return data;
  },

  invalidate(key: string) {
    this.templates.delete(key);
    this.commonConfigs.delete(key);
  }
};
```

Implementation Instructions:

1. Type Updates:
- Update existing type definitions first
- Ensure backward compatibility
- Add new interfaces gradually

2. Service Layer:
- Implement enhanced service class
- Add caching mechanism
- Update query optimization

3. API Router:
- Update validation schemas
- Implement selective loading
- Add new endpoints for analytics

4. Form Components:
- Implement ActivityFormManager
- Update form validation
- Add new configuration fields

5. Caching:
- Implement caching utility
- Add cache invalidation
- Update service methods to use cache

This implementation provides:
- Better code organization
- Enhanced performance
- Improved feature set
- Better type safety
- Optimized data loading
- Efficient caching

Remember to:
- Update tests
- Maintain backward compatibility
- Document new features
- Update API documentation
- Monitor performance metrics