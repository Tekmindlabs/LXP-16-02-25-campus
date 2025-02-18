import { type ClassActivity, type Prisma } from "@prisma/client";
import { type ActivityType, ActivityStatus, ActivityMode, ActivityScope } from "@prisma/client";

import { type Option } from "@/types";

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
