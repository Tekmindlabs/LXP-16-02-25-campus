import { z } from "zod";
import { type Context, createTRPCRouter, protectedProcedure } from "../trpc";
import { CampusPermission, CampusRoleType } from '@/types/campus';
import { DefaultRoles } from '@/utils/permissions';
import { TRPCError } from "@trpc/server";
import { CampusUserService } from "../../services/CampusUserService";

const campusCreateInput = z.object({ 
  name: z.string(),
  code: z.string(),
  establishmentDate: z.string().transform((str) => new Date(str)),
  type: z.enum(["MAIN", "BRANCH"]),
  streetAddress: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
  primaryPhone: z.string(),
  email: z.string().email(),
  emergencyContact: z.string(),
  secondaryPhone: z.string().optional(),
  gpsCoordinates: z.string().optional(),
});

const campusUpdateInput = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  establishmentDate: z.string().transform((str) => new Date(str)),
  type: z.enum(["MAIN", "BRANCH"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  streetAddress: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
  primaryPhone: z.string(),
  email: z.string().email(),
  emergencyContact: z.string(),
  secondaryPhone: z.string().optional(),
  gpsCoordinates: z.string().optional(),
});

export const campusRouter = createTRPCRouter({
  create: protectedProcedure
    .input(campusCreateInput)
    .mutation(async ({ ctx, input }: { ctx: Context; input: z.infer<typeof campusCreateInput> }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const isSuperAdmin = ctx.session.user.roles?.includes(DefaultRoles.SUPER_ADMIN);
      const hasManagePermission = ctx.session.user.permissions?.includes('campus:manage');

      if (!isSuperAdmin && !hasManagePermission) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create campuses',
        });
      }

      return ctx.prisma.$transaction(async (tx) => {
        const campus = await tx.campus.create({
          data: {
            ...input,
            status: "ACTIVE",
          },
        });

        console.log('Campus created:', campus.id);

        const campusRole = await tx.campusRole.create({
          data: {
            userId: ctx.session?.user?.id,
            campusId: campus.id,
            roleId: CampusRoleType.CAMPUS_ADMIN, // Direct assignment of roleId
            permissions: {
              create: [
                CampusPermission.MANAGE_CAMPUS_CLASSES,
                CampusPermission.MANAGE_CAMPUS_TEACHERS,
                CampusPermission.MANAGE_CAMPUS_STUDENTS,
                CampusPermission.MANAGE_CAMPUS_TIMETABLES,
                CampusPermission.MANAGE_CAMPUS_ATTENDANCE,
                CampusPermission.VIEW_CAMPUS_ANALYTICS,
                CampusPermission.VIEW_PROGRAMS,
                CampusPermission.VIEW_CLASS_GROUPS
              ].map(permissionId => ({
                permissionId,
                campusId: campus.id
              }))
            }
          },
        });

        console.log('Campus role created:', campusRole.id);

        return tx.campus.findUnique({
          where: { id: campus.id },
          include: {
            roles: true,
            buildings: true,
          },
        });
      });
    }),

  getAll: protectedProcedure
    .query(async ({ ctx }: { ctx: Context }) => {
      if (!ctx.session?.user?.id || !ctx.session?.user?.roles) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      console.log('Fetching campuses for user:', {
        userId: ctx.session.user.id,
        roles: ctx.session.user.roles
      });

      const isSuperAdmin = ctx.session.user.roles.includes(DefaultRoles.SUPER_ADMIN);
      console.log('User is super admin:', isSuperAdmin);

      if (isSuperAdmin) {
        const campuses = await ctx.prisma.campus.findMany({
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            roles: true,
            buildings: true,
          }
        });
        console.log('Found campuses:', campuses.length);
        return campuses;
      }

      const campuses = await ctx.prisma.campus.findMany({
        where: {
          roles: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          roles: true,
          buildings: true,
        }
      });
      console.log('Found campuses for regular user:', campuses.length);
      return campuses;
    }),

  getUserPermissions: protectedProcedure
    .query(async ({ ctx }: { ctx: Context }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const campusRole = await ctx.prisma.campusRole.findFirst({
        where: {
          userId: ctx.session.user.id,
        },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      });

      if (!campusRole?.role?.permissions) {
        return [];
      }

      return campusRole.role.permissions.map((p: { permissionId: string }) => p.permissionId as CampusPermission);
    }),

  getMetrics: protectedProcedure
    .input(z.object({ campusId: z.string() }))
    .query(async ({ ctx, input }: { ctx: Context; input: { campusId: string } }) => {
      const [studentCount, teacherCount, programCount, classGroupCount] = await Promise.all([
        ctx.prisma.studentProfile.count({
          where: {
            class: {
              campusId: input.campusId,
            },
          },
        }),
        ctx.prisma.teacherProfile.count({
          where: {
            classes: {
              some: {
                class: {
                  campusId: input.campusId,
                },
              },
            },
          },
        }),
        ctx.prisma.program.count({
          where: {
            classGroups: {
              some: {
                classes: {
                  some: {
                    campusId: input.campusId,
                  },
                },
              },
            },
          },
        }),
        ctx.prisma.classGroup.count({
          where: {
            classes: {
              some: {
                campusId: input.campusId,
              },
            },
          },
        }),
      ]);

      return {
        studentCount,
        teacherCount,
        programCount,
        classGroupCount,
      };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }: { ctx: Context; input: string }) => {
      return ctx.prisma.campus.findUnique({
        where: { id: input },
        include: {
          roles: true,
          buildings: true,
        },
      });
    }),

  update: protectedProcedure
    .input(campusUpdateInput)
    .mutation(async ({ ctx, input }: { ctx: Context; input: z.infer<typeof campusUpdateInput> }) => {
      const { id, ...data } = input;
      return ctx.prisma.campus.update({
        where: { id },
        data,
        include: {
          roles: true,
          buildings: true,
        },
      });
    }),
});

export const campusViewRouter = createTRPCRouter({
  getInheritedPrograms: protectedProcedure
    .input(z.object({ campusId: z.string() }))
    .query(async ({ ctx, input }: { ctx: Context; input: { campusId: string } }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }
      const hasPermission = await ctx.prisma.campusRole.findFirst({
        where: {
          userId: ctx.session.user.id,
          campusId: input.campusId,
          role: {
            permissions: {
              some: {
                permissionId: CampusPermission.VIEW_PROGRAMS
              }
            }
          }
        },
      });

      if (!hasPermission) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return ctx.prisma.program.findMany({
        where: {
          calendarId: {
            equals: input.campusId,
          },
        },
      });
    }),

  getInheritedClassGroups: protectedProcedure
    .input(z.object({ campusId: z.string() }))
    .query(async ({ ctx, input }: { ctx: Context; input: { campusId: string } }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }
      const hasPermission = await ctx.prisma.campusRole.findFirst({
        where: {
          userId: ctx.session.user.id,
          campusId: input.campusId,
          role: {
            permissions: {
              some: {
                permissionId: CampusPermission.VIEW_CLASS_GROUPS
              }
            }
          }
        },
      });

      if (!hasPermission) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return ctx.prisma.classGroup.findMany({
        where: {
          calendarId: input.campusId,
        },
      });
    }),
});


