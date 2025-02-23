import { PrismaClient } from "@prisma/client";
import { CampusPermission, CampusRoleType } from "../../types/campus";
import { TRPCError } from "@trpc/server";

interface CampusRoleInfo {
  campusId: string;
  role: CampusRoleType;
  permissions: CampusPermission[];
}

interface CampusRoleData {
  userId: string;
  campusId: string;
  role: string;
  permissions: string[];
}

export class CampusUserService {
  private readonly allowedCampusPermissions: CampusPermission[] = [
    CampusPermission.MANAGE_CAMPUS_CLASSES,
    CampusPermission.MANAGE_CAMPUS_TEACHERS,
    CampusPermission.MANAGE_CAMPUS_STUDENTS,
    CampusPermission.MANAGE_CAMPUS_TIMETABLES,
    CampusPermission.MANAGE_CAMPUS_ATTENDANCE,
    CampusPermission.VIEW_CAMPUS_ANALYTICS,
    CampusPermission.VIEW_PROGRAMS,
    CampusPermission.VIEW_CLASS_GROUPS
  ];

  constructor(private readonly db: PrismaClient) {}

  async assignCampusRole(userId: string, campusId: string, role: CampusRoleType): Promise<void> {
    try {
      const data: CampusRoleData = {
        userId,
        campusId,
        role: role.toString(),
        permissions: this.getDefaultPermissionsForRole(role).map(p => p.toString()),
      };

      await this.db.campusRole.create({ data });
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to assign campus role',
      });
    }
  }

  async updateCampusRole(userId: string, campusId: string, role: CampusRoleType): Promise<void> {
    try {
      await this.db.campusRole.update({
        where: {
          userId_campusId: {
            userId,
            campusId,
          },
        },
        data: {
          role,
          permissions: this.getDefaultPermissionsForRole(role),
        },
      });
    } catch (error) {
      console.error('Error updating campus role:', error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update campus role"
      });
    }
  }

  async getUserRole(userId: string, campusId: string): Promise<CampusRoleType | null> {
    const result = await this.db.campusRole.findUnique({
      where: {
        userId_campusId: {
          userId,
          campusId,
        },
      },
    });
    return result?.role ? (result.role as CampusRoleType) : null;
  }

  async hasPermission(userId: string, campusId: string, permission: CampusPermission): Promise<boolean> {
    const result = await this.db.campusRole.findUnique({
      where: {
        userId_campusId: {
          userId,
          campusId,
        },
      },
    });
    return result?.permissions.includes(permission) ?? false;
  }

  async getUserCampusRoles(userId: string): Promise<CampusRoleInfo[]> {
    try {
      const roles = await this.db.campusRole.findMany({
        where: { userId },
        select: {
          campusId: true,
          role: true,
          permissions: true
        }
      });
      
      return roles.map(role => ({
        campusId: role.campusId,
        role: role.role as CampusRoleType,
        permissions: role.permissions.map(p => p as CampusPermission),
      }));
    } catch (error) {
      console.error('Error fetching user campus roles:', error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user campus roles"
      });
    }
  }

  private getDefaultPermissionsForCoordinator(): CampusPermission[] {
    return [
      CampusPermission.MANAGE_CAMPUS_CLASSES,
      CampusPermission.MANAGE_CAMPUS_TEACHERS,
      CampusPermission.MANAGE_CAMPUS_STUDENTS,
      CampusPermission.VIEW_CAMPUS_ANALYTICS,
      CampusPermission.VIEW_PROGRAMS,
    ];
  }

  private getDefaultPermissionsForRole(role: CampusRoleType): CampusPermission[] {
    switch (role) {
      case CampusRoleType.CAMPUS_ADMIN:
        return [
          CampusPermission.MANAGE_CAMPUS_CLASSES,
          CampusPermission.MANAGE_CAMPUS_TEACHERS,
          CampusPermission.MANAGE_CAMPUS_STUDENTS,
          CampusPermission.MANAGE_CAMPUS_TIMETABLES,
          CampusPermission.MANAGE_CAMPUS_ATTENDANCE,
          CampusPermission.VIEW_CAMPUS_ANALYTICS,
          CampusPermission.VIEW_PROGRAMS,
          CampusPermission.VIEW_CLASS_GROUPS
        ];
      case CampusRoleType.CAMPUS_MANAGER:
        return [
          CampusPermission.MANAGE_CAMPUS_CLASSES,
          CampusPermission.MANAGE_CAMPUS_TEACHERS,
          CampusPermission.MANAGE_CAMPUS_STUDENTS,
          CampusPermission.VIEW_CAMPUS_ANALYTICS,
          CampusPermission.VIEW_PROGRAMS,
          CampusPermission.VIEW_CLASS_GROUPS
        ];
      case CampusRoleType.CAMPUS_TEACHER:
        return [
          CampusPermission.MANAGE_CAMPUS_ATTENDANCE,
          CampusPermission.VIEW_PROGRAMS,
          CampusPermission.VIEW_CLASS_GROUPS
        ];
      default:
        return [CampusPermission.VIEW_PROGRAMS, CampusPermission.VIEW_CLASS_GROUPS];
    }
  }
}
