import type { DbAccess, DbAppStudent, DbAppUser, NewDbAccess, NewDbAppStudent, NewDbAppUser } from "./db.js"

export interface IDbClient {
	getStudents: () => Promise<DbAppStudent[]>
	replaceStudents: (students: (DbAppStudent | NewDbAppStudent)[]) => Promise<void>
	getUsers: () => Promise<DbAppUser[]>
	replaceUsers: (users: (DbAppUser | NewDbAppUser)[]) => Promise<void>
	getAccess: () => Promise<DbAccess[]>
	replaceAccess: (accesses: (DbAccess | NewDbAccess)[]) => Promise<void>
}
