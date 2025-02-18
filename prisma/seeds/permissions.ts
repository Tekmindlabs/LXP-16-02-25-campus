import { PrismaClient } from '@prisma/client';
import { Permissions, DefaultRoles, RolePermissions } from '@/utils/permissions';

export async function seedPermissions(prisma: PrismaClient) {
	console.log('Seeding permissions and roles...');

	// Create all permissions
	const permissions = await Promise.all(
		Object.values(Permissions).map(async (permissionName) => {
			return prisma.permission.upsert({
				where: { name: permissionName },
				update: {},
				create: {
					name: permissionName,
					description: `Permission to ${permissionName.toLowerCase().replace(':', ' ')}`
				}
			});
		})
	);

	// Create roles
	const roles = await Promise.all([
		// Super Admin Role
		prisma.role.upsert({
			where: { name: DefaultRoles.SUPER_ADMIN },
			update: {
				description: 'Super Administrator with full access',
				permissions: {
					deleteMany: {},
					create: permissions.map(permission => ({
						permission: { connect: { id: permission.id } }
					}))
				}
			},
			create: {
				name: DefaultRoles.SUPER_ADMIN,
				description: 'Super Administrator with full access',
				permissions: {
					create: permissions.map(permission => ({
						permission: { connect: { id: permission.id } }
					}))
				}
			}
		}),
		// Admin Role
		prisma.role.upsert({
			where: { name: DefaultRoles.ADMIN },
			update: {
				description: 'Institution Administrator'
			},
			create: {
				name: DefaultRoles.ADMIN,
				description: 'Institution Administrator'
			}
		}),
		// Coordinator Role
		prisma.role.upsert({
			where: { name: DefaultRoles.COORDINATOR },
			update: {
				description: 'Academic Coordinator'
			},
			create: {
				name: DefaultRoles.COORDINATOR,
				description: 'Academic Coordinator'
			}
		}),
		// Teacher Role
		prisma.role.upsert({
			where: { name: DefaultRoles.TEACHER },
			update: {
				description: 'Teacher'
			},
			create: {
				name: DefaultRoles.TEACHER,
				description: 'Teacher'
			}
		}),
		// Student Role
		prisma.role.upsert({
			where: { name: DefaultRoles.STUDENT },
			update: {
				description: 'Student'
			},
			create: {
				name: DefaultRoles.STUDENT,
				description: 'Student'
			}
		}),
		// Parent Role
		prisma.role.upsert({
			where: { name: DefaultRoles.PARENT },
			update: {
				description: 'Parent'
			},
			create: {
				name: DefaultRoles.PARENT,
				description: 'Parent'
			}
		})
	]);

	// Assign permissions to roles based on RolePermissions mapping
	for (const role of roles) {
		const rolePermissions = RolePermissions[role.name as keyof typeof RolePermissions] || [];
		await Promise.all(
			rolePermissions.map(permissionName => {
				const permission = permissions.find(p => p.name === permissionName);
				if (!permission) return Promise.resolve();

				return prisma.rolePermission.upsert({
					where: {
						roleId_permissionId_campusId: {
							roleId: role.id,
							permissionId: permission.id,
							campusId: ''  // Assuming campusId can be null for global permissions - changed back to null
						}
					},
					update: {},
					create: {
						roleId: role.id,
						permissionId: permission.id,
						campusId: '' // Assuming campusId can be null for global permissions - changed back to null
					}
				});
			})
		);
	}

	console.log('Permissions and roles seeded successfully');
	return { permissions, roles };
}
