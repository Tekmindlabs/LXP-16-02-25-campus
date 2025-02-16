import { PrismaClient } from "@prisma/client";
import { CampusClassService } from "../services/CampusClassService";
import { jest } from '@jest/globals';
import { Sql } from "@prisma/client/runtime/library";

describe('CampusClassService', () => {
	const mockExecuteRaw = jest.fn().mockResolvedValue([1]);
	const mockQueryRaw = jest.fn();
	
	const prisma = {
		$executeRaw: (strings: Sql, ...values: any[]) => mockExecuteRaw(strings, ...values),
		$queryRaw: (strings: Sql, ...values: any[]) => mockQueryRaw(strings, ...values)
	} as unknown as PrismaClient;

	const mockUserService = {
		hasPermission: jest.fn().mockResolvedValue(true)
	};

	const classService = new CampusClassService(prisma, mockUserService);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('createClass', () => {
		it('should create a class', async () => {
			const mockData = {
				name: 'Test Class',
				classGroupId: 'group-1',
				capacity: 30
			};

			const mockResult = [{
				id: 'class-1',
				...mockData,
				campusId: 'campus-1',
				status: 'ACTIVE',
				createdAt: new Date(),
				updatedAt: new Date()
			}];

			mockQueryRaw.mockResolvedValueOnce(mockResult);

			const result = await classService.createClass('user-1', 'campus-1', mockData);

			expect(result).toEqual(mockResult[0]);
			expect(mockQueryRaw).toHaveBeenCalled();
		});
	});

	describe('updateClass', () => {
		it('should update a class', async () => {
			const mockUpdates = {
				name: 'Updated Class',
				capacity: 35
			};

			const mockResult = [{
				id: 'class-1',
				...mockUpdates,
				campusId: 'campus-1',
				classGroupId: 'group-1',
				status: 'ACTIVE',
				createdAt: new Date(),
				updatedAt: new Date()
			}];

			mockQueryRaw.mockResolvedValueOnce(mockResult);

			const result = await classService.updateClass('user-1', 'campus-1', 'class-1', mockUpdates);

			expect(result).toEqual(mockResult[0]);
			expect(mockQueryRaw).toHaveBeenCalled();
		});
	});

	describe('getClass', () => {
		it('should get a class by id', async () => {
			const mockClass = {
				id: 'class-1',
				name: 'Test Class',
				campusId: 'campus-1',
				classGroupId: 'group-1',
				capacity: 30,
				status: 'ACTIVE',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			mockQueryRaw.mockResolvedValueOnce([mockClass]);

			const result = await classService.getClass('user-1', 'campus-1', 'class-1');

			expect(result).toEqual(mockClass);
			expect(mockQueryRaw).toHaveBeenCalled();
		});
	});

	describe('getClasses', () => {
		it('should get all classes for a campus', async () => {
			const mockClasses = [{
				id: 'class-1',
				name: 'Test Class',
				campusId: 'campus-1',
				classGroupId: 'group-1',
				capacity: 30,
				status: 'ACTIVE',
				createdAt: new Date(),
				updatedAt: new Date()
			}];

			mockQueryRaw.mockResolvedValueOnce(mockClasses);

			const result = await classService.getClasses('user-1', 'campus-1');

			expect(result).toEqual(mockClasses);
			expect(mockQueryRaw).toHaveBeenCalled();
		});
	});

	describe('deleteClass', () => {
		it('should delete a class', async () => {
			await classService.deleteClass('user-1', 'campus-1', 'class-1');

			expect(mockExecuteRaw).toHaveBeenCalled();
		});
	});
});