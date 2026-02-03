import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { ObjectId } from "mongodb"
import type { DbAccess, DbAppStudent, DbAppUser, NewDbAccess, NewDbAppStudent, NewDbAppUser } from "../../types/db/db.js"
import type { IDbClient } from "../../types/db/db-client.js"

type MockDb = {
	access: DbAccess[]
	students: DbAppStudent[]
	users: DbAppUser[]
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

	async getStudents(): Promise<DbAppStudent[]> {
		return mockDb.students
	}

	async replaceStudents(students: (DbAppStudent | NewDbAppStudent)[]): Promise<void> {
		students.forEach((student) => {
			if (!("_id" in student)) {
				;(student as DbAppStudent)._id = new ObjectId()
			}
		})
		mockDb.students = students as DbAppStudent[]
		writeFileSync(`${this.debugFolderPath}/mock-students.json`, JSON.stringify(students, null, 2))
	}

	async getUsers(): Promise<DbAppUser[]> {
		return mockDb.users
	}

	async replaceUsers(users: (DbAppUser | NewDbAppUser)[]): Promise<void> {
		users.forEach((user) => {
			if (!("_id" in user)) {
				;(user as DbAppUser)._id = new ObjectId()
			}
		})
		mockDb.users = users as DbAppUser[]
		writeFileSync(`${this.debugFolderPath}/mock-users.json`, JSON.stringify(users, null, 2))
	}

	async getAccess(): Promise<DbAccess[]> {
		return mockDb.access
	}

	async replaceAccess(accesses: (DbAccess | NewDbAccess)[]): Promise<void> {
		accesses.forEach((access) => {
			if (!("_id" in access)) {
				;(access as DbAccess)._id = new ObjectId()
			}
		})
		mockDb.access = accesses as DbAccess[]
		writeFileSync(`${this.debugFolderPath}/mock-access.json`, JSON.stringify(accesses, null, 2))
	}
}
