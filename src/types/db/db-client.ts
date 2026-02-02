import type { Access, AppStudent, AppUser, NewAccess, NewAppStudent, NewAppUser } from "./db.js"

export interface IDbClient {
	getStudents: () => Promise<AppStudent[]>
	replaceStudents: (students: (AppStudent | NewAppStudent)[]) => Promise<void>
	getUsers: () => Promise<AppUser[]>
	replaceUsers: (users: (AppUser | NewAppUser)[]) => Promise<void>
	getAccess: () => Promise<Access[]>
	replaceAccess: (accesses: (Access | NewAccess)[]) => Promise<void>
}
