import type { DbAccess, DbAppStudent, DbAppUser, DbSchool, NewAppStudent, NewAppUser, NewDbAccess, NewSchool } from "./shared-types.js"

export interface IDbClient {
  getStudents: () => Promise<DbAppStudent[]>
  replaceStudents: (students: (DbAppStudent | NewAppStudent)[]) => Promise<void>
  getUsers: () => Promise<DbAppUser[]>
  replaceUsers: (users: (DbAppUser | NewAppUser)[]) => Promise<void>
  getAccess: () => Promise<DbAccess[]>
  replaceAccess: (accesses: (DbAccess | NewDbAccess)[]) => Promise<void>
  getSchools: () => Promise<DbSchool[]>
  replaceSchools: (schools: (DbSchool | NewSchool)[]) => Promise<void>
}
