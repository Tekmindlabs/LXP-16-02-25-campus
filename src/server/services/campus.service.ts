import { PrismaClient } from "@prisma/client";
import { CreateCampusInput, CreateBuildingInput, CreateFloorInput, CreateWingInput, CreateRoomInput } from "../../types/validation/campus";
import { Campus, Building, Floor, Wing, Room } from "../../types/campus";

export class CampusService {
	constructor(private readonly db: PrismaClient) {}

	async createCampus(data: CreateCampusInput): Promise<Campus> {
		return this.db.campus.create({
			data: {
				...data,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			include: {
				buildings: true
			}
		});
	}

	async updateCampus(id: string, data: Partial<CreateCampusInput>): Promise<Campus> {
		return this.db.campus.update({
			where: { id },
			data: {
				...data,
				updatedAt: new Date()
			},
			include: {
				buildings: true
			}
		});
	}

	async deleteCampus(id: string): Promise<void> {
		await this.db.campus.delete({
			where: { id }
		});
	}

	async getCampus(id: string): Promise<Campus | null> {
		return this.db.campus.findUnique({
			where: { id },
			include: {
				buildings: {
					include: {
						floors: {
							include: {
								wings: {
									include: {
										rooms: true
									}
								}
							}
						}
					}
				}
			}
		});
	}

	async listCampuses(): Promise<Campus[]> {
		return this.db.campus.findMany({
			include: {
				buildings: true
			}
		});
	}

	// Building management
	async createBuilding(data: CreateBuildingInput): Promise<Building> {
		return this.db.building.create({
			data: {
				...data,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			include: {
				floors: true
			}
		});
	}

	async createFloor(data: CreateFloorInput): Promise<Floor> {
		return this.db.floor.create({
			data: {
				...data,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			include: {
				wings: true
			}
		});
	}

	async createWing(data: CreateWingInput): Promise<Wing> {
		return this.db.wing.create({
			data: {
				...data,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			include: {
				rooms: true
			}
		});
	}

	async createRoom(data: CreateRoomInput): Promise<Room> {
		return this.db.room.create({
			data: {
				...data,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		});
	}
}