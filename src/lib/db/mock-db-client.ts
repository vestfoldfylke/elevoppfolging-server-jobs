import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { ObjectId } from "mongodb"
import type { IDbClient } from "../../types/db/db-client.js"
import type { DbAccess, DbAppStudent, DbAppUser, NewAccess, NewAppStudent, NewAppUser } from "../../types/db/shared-types.js"

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

	async replaceStudents(students: (DbAppStudent | NewAppStudent)[]): Promise<void> {
		const withIds: DbAppStudent[] = students.map((student) => {
			if ("_id" in student) {
				return student
			}
			return {
				...student,
				_id: new ObjectId()
			}
		})
		mockDb.students = withIds
		writeFileSync(`${this.debugFolderPath}/mock-students.json`, JSON.stringify(withIds, null, 2))
	}

	async getUsers(): Promise<DbAppUser[]> {
		return mockDb.users
	}

	async replaceUsers(users: (DbAppUser | NewAppUser)[]): Promise<void> {
		const withIds: DbAppUser[] = users.map((user) => {
			if ("_id" in user) {
				return user
			}
			return {
				...user,
				_id: new ObjectId()
			}
		})
		mockDb.users = withIds
		writeFileSync(`${this.debugFolderPath}/mock-users.json`, JSON.stringify(withIds, null, 2))
	}

	async getAccess(): Promise<DbAccess[]> {
		return mockDb.access
	}

	async replaceAccess(accesses: (DbAccess | NewAccess)[]): Promise<void> {
		const withIds: DbAccess[] = accesses.map((access) => {
			if ("_id" in access) {
				return access
			}
			return {
				...access,
				_id: new ObjectId()
			}
		})
		mockDb.access = withIds
		writeFileSync(`${this.debugFolderPath}/mock-access.json`, JSON.stringify(withIds, null, 2))
	}
}
