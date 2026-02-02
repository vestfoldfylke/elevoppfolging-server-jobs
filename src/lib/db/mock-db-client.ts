import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { ObjectId } from "mongodb"
import type { Access, AppStudent, AppUser, IDbClient, NewAccess, NewAppStudent, NewAppUser } from "../../types/db.js"

type MockDb = {
	access: Access[]
	students: AppStudent[]
	users: AppUser[]
}

/**
 * Object that simulates a database for testing purposes. Each property is a collection in the database.
 */
const mockDb: MockDb = {
	access: [],
	students: [],
	users: []
}

export class MockDbClient implements IDbClient {
	private readonly debugFolderPath = "./debug-db"
	constructor() {
		if (!existsSync(this.debugFolderPath)) {
			mkdirSync(this.debugFolderPath)
		}
	}

	async getStudents(): Promise<AppStudent[]> {
		return mockDb.students
	}

	async replaceStudents(students: (AppStudent | NewAppStudent)[]): Promise<void> {
		students.forEach((student) => {
			if (!("_id" in student)) {
				;(student as AppStudent)._id = new ObjectId()
			}
		})
		mockDb.students = students as AppStudent[]
		writeFileSync(`${this.debugFolderPath}/mock-students.json`, JSON.stringify(students, null, 2))
	}

	async getUsers(): Promise<AppUser[]> {
		return mockDb.users
	}

	async replaceUsers(users: (AppUser | NewAppUser)[]): Promise<void> {
		users.forEach((user) => {
			if (!("_id" in user)) {
				;(user as AppUser)._id = new ObjectId()
			}
		})
		mockDb.users = users as AppUser[]
		writeFileSync(`${this.debugFolderPath}/mock-users.json`, JSON.stringify(users, null, 2))
	}

	async getAccess(): Promise<Access[]> {
		return mockDb.access
	}

	async replaceAccess(accesses: (Access | NewAccess)[]): Promise<void> {
		accesses.forEach((access) => {
			if (!("_id" in access)) {
				;(access as Access)._id = new ObjectId()
			}
		})
		mockDb.access = accesses as Access[]
		writeFileSync(`${this.debugFolderPath}/mock-access.json`, JSON.stringify(accesses, null, 2))
	}
}
