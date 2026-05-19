import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { ObjectId } from "mongodb"
import type { IDbClient } from "../../types/db/db-client.js"
import type { DbAccess, DbAppStudent, DbAppUser, DbEmailAlert, DbSchool, EmailAlertReceiver, EmailAlertStatus, NewAppStudent, NewAppUser, NewDbAccess, NewSchool } from "../../types/db/shared-types.js"
import { norwegianFaker } from "../fint/generate-fint-mock-data.js"

type MockDb = {
  access: DbAccess[]
  students: DbAppStudent[]
  users: DbAppUser[]
  schools: DbSchool[]
  emailAlerts: DbEmailAlert[]
}

/**
 * Object that simulates a database for testing purposes. Each property is a collection in the database.
 */
const mockDb: MockDb = {
  access: [],
  students: [],
  users: [],
  schools: [],
  emailAlerts: []
}

export class MockDbClient implements IDbClient {
  private readonly debugFolderPath = "./debug-db"

  constructor() {
    if (!existsSync(this.debugFolderPath)) {
      mkdirSync(this.debugFolderPath)
    }

    this.fillEmailAlertsDb()
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

  async replaceAccess(accesses: (DbAccess | NewDbAccess)[]): Promise<void> {
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

  async getSchools(): Promise<DbSchool[]> {
    return mockDb.schools
  }

  async replaceSchools(schools: (DbSchool | NewSchool)[]): Promise<void> {
    const withIds: DbSchool[] = schools.map((school) => {
      if ("_id" in school) {
        return school
      }

      return {
        ...school,
        _id: new ObjectId()
      }
    })

    mockDb.schools = withIds

    writeFileSync(`${this.debugFolderPath}/mock-schools.json`, JSON.stringify(withIds, null, 2))
  }

  async getEmailAlertsToHandle(): Promise<DbEmailAlert[]> {
    return Promise.resolve(mockDb.emailAlerts.filter((emailAlert: DbEmailAlert) => ["QUEUED", "SENDING"].includes(emailAlert.status)))
  }

  async updateEmailAlert(updatedAlert: DbEmailAlert): Promise<void> {
    console.log("Updating EmailAlert with Id:", updatedAlert._id.toString(), "-- New status:", updatedAlert.status)

    const index: number = mockDb.emailAlerts.findIndex((alert: DbEmailAlert) => alert._id.toString() === updatedAlert._id.toString())

    if (index === -1) {
      console.error("Email alert not found in mock db, update failed")
      return
    }

    mockDb.emailAlerts[index] = updatedAlert
    console.log("Email alert updated successfully in mock db")
  }

  async getStudentNameById(studentId: string): Promise<string | null> {
    // For mock purposes, randomly return a name or null
    const randomNum: number = Math.floor(Math.random() * 10)

    if (randomNum < 5) {
      return `${norwegianFaker.person.fullName()} ${studentId}`
    }

    return null
  }

  private fillEmailAlertsDb(): void {
    const totalNumOfEmailAlerts: number = Math.floor(Math.random() * 25)
    console.log("Filling mock db email alerts with", totalNumOfEmailAlerts, "email alerts")

    for (let i = 0; i < totalNumOfEmailAlerts; i++) {
      const receivers: EmailAlertReceiver[] = this.getMockEmailAlertReceivers()
      const status: EmailAlertStatus = this.getMockEmailAlertStatus(receivers)
      console.log("Overall status for email alert:", status)

      mockDb.emailAlerts.push({
        _id: new ObjectId(),
        type: Math.random() > 0.5 ? "DOCUMENT_CREATED" : "DOCUMENT_MESSAGE_CREATED",
        created: {
          at: new Date(),
          by: {
            entraUserId: `entra-user-${Math.random() * 1000}`,
            fallbackName: norwegianFaker.person.fullName()
          }
        },
        documentId: new ObjectId(),
        status,
        receivers,
        alertBody: {
          body: "This is a mock email alert body",
          subject: "This is a mock email alert subject"
        }
      })
    }
  }

  private getMockEmailAlertStatus(receivers: EmailAlertReceiver[]): EmailAlertStatus {
    if (receivers.every((receiver: EmailAlertReceiver) => receiver.status === "QUEUED")) {
      return "QUEUED"
    }

    if (receivers.every((receiver: EmailAlertReceiver) => receiver.status === "FAILED")) {
      return "FAILED"
    }

    if (receivers.every((receiver: EmailAlertReceiver) => receiver.status === "SENT")) {
      return "SENT"
    }

    return "QUEUED"
  }

  private getMockEmailAlertReceiverStatus(): EmailAlertStatus {
    const randomNum: number = Math.floor(Math.random() * 91)

    if (randomNum >= 0 && randomNum < 30) {
      return "QUEUED"
    }

    if (randomNum >= 30 && randomNum < 60) {
      return "FAILED"
    }

    return "SENT"
  }

  private getMockEmailAlertReceivers(): EmailAlertReceiver[] {
    const randomNum: number = Math.floor(Math.random() * 26)
    console.log("Returning", randomNum, "receivers for email alert")
    const receivers: EmailAlertReceiver[] = []

    for (let i = 0; i < randomNum; i++) {
      const receiver: string = norwegianFaker.internet.email()
      const status: EmailAlertStatus = this.getMockEmailAlertReceiverStatus()
      const messageId: string | undefined = status === "QUEUED" ? undefined : `message-id-${Math.random() * 1000}`
      console.log("Email alert receiver", receiver, "has status", status, "with messageId", messageId)

      receivers.push({
        receiver,
        status,
        messageId
      })
    }

    return receivers
  }
}
