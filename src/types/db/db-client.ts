import type { DbAccess, DbAppStudent, DbAppUser, NewAccess, NewAppStudent, NewAppUser } from "./shared-types.js"

export interface IDbClient {
	getStudents: () => Promise<DbAppStudent[]>
	replaceStudents: (students: (DbAppStudent | NewAppStudent)[]) => Promise<void>
	getUsers: () => Promise<DbAppUser[]>
	replaceUsers: (users: (DbAppUser | NewAppUser)[]) => Promise<void>
	getAccess: () => Promise<DbAccess[]>
	replaceAccess: (accesses: (DbAccess | NewAccess)[]) => Promise<void>
}
