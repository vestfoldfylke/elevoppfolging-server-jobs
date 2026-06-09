import { logger } from "@vestfoldfylke/loglady"
import { type Binary, type Db, type Document, ObjectId, type OptionalUnlessRequiredId } from "mongodb"
import { MONGODB } from "../../config.js"
import type { IDbClient } from "../../types/db/db-client.js"
import type {
  DbAccess,
  DbAppStudent,
  DbAppUser,
  DbEmailAlert,
  DbEncryptedAppStudent,
  DbGroupDocument,
  DbGroupImportantStuff,
  DbSchool,
  DbStudentDataSharingConsent,
  DbStudentDocument,
  DbStudentImportantStuff,
  NewAppStudent,
  NewAppUser,
  NewDbAccess,
  NewSchool
} from "../../types/db/shared-types.js"

export class MongoDbClient implements IDbClient {
  private readonly db: Db
  private readonly encryptValue: (value: unknown) => Promise<Binary>

  constructor(db: Db, encryptValue: (value: unknown) => Promise<Binary>) {
    this.db = db
    this.encryptValue = encryptValue
  }

  private async replaceCollection<T extends Document>(collectionName: string, items: OptionalUnlessRequiredId<T>[]): Promise<void> {
    const collections = await this.db.listCollections().toArray()

    const previousCollectionName = `${collectionName}_previous`
    const newCollectionName = `${collectionName}_new`
    const hasCurrent = collections.some((col) => col.name === collectionName)
    const hasPrevious = collections.some((col) => col.name === previousCollectionName)
    const hasNew = collections.some((col) => col.name === newCollectionName)

    if (hasPrevious && hasNew) {
      logger.error("Both {PreviousCollectionName} and {NewCollectionName} exist. Manual intervention required. SEND TO JAIL! R og J må inn og fikse dette", previousCollectionName, newCollectionName)
      throw new Error(`Both ${previousCollectionName} and ${newCollectionName} exist. Manual intervention required.`)
    }

    if (hasPrevious) {
      try {
        logger.info("Renaming collection {PreviousCollectionName} to {NewCollectionName}", previousCollectionName, newCollectionName)
        await this.db.collection(previousCollectionName).rename(newCollectionName)
        logger.info("Renamed collection {PreviousCollectionName} to {NewCollectionName}", previousCollectionName, newCollectionName)
      } catch (error) {
        logger.errorException(error, `Error renaming collection ${previousCollectionName} to ${newCollectionName}`)
        throw error
      }
    }

    // Now, insert into collection
    try {
      const collection = this.db.collection<T>(newCollectionName)

      await collection.deleteMany({})
      if (items.length > 0) {
        logger.info("Inserting {itemCount} items into collection {collectionName}", items.length, newCollectionName)
        await collection.insertMany(items)
        logger.info("Replaced collection {collectionName} with {itemCount} items", newCollectionName, items.length)
      } else {
        logger.warn("{itemCount} items to insert into collection {collectionName}", items.length, newCollectionName)
      }
    } catch (error) {
      logger.errorException(error, "Error replacing collection {collectionName}", newCollectionName)
      throw error
    }

    // Finally, rename collections
    if (hasCurrent) {
      try {
        logger.info("Renaming collection {CollectionName} to {PreviousCollectionName}", collectionName, previousCollectionName)
        await this.db.collection(collectionName).rename(previousCollectionName)
        logger.info("Renamed collection {CollectionName} to {PreviousCollectionName}", collectionName, previousCollectionName)
      } catch (error) {
        logger.errorException(error, `Error renaming collection ${collectionName} to ${previousCollectionName}`)
        throw error
      }
    } else {
      logger.info(
        "No existing collection named {CollectionName} to rename to {PreviousCollectionName}, will skip this step, and just create the new collection",
        collectionName,
        previousCollectionName
      )
    }

    if (items.length === 0) {
      try {
        logger.info("{itemCount} items to insert into {CollectionName}. Removing any possible current items...", items.length, collectionName)
        await this.db.collection(collectionName).deleteMany({})

        return
      } catch (error) {
        logger.errorException(error, `Error renaming collection ${newCollectionName} to ${collectionName}`)
        throw error
      }
    }

    try {
      logger.info("Renaming collection {NewCollectionName} to {CollectionName}", newCollectionName, collectionName)
      await this.db.collection(newCollectionName).rename(collectionName)
      logger.info("Renamed collection {NewCollectionName} to {CollectionName}", newCollectionName, collectionName)
    } catch (error) {
      logger.errorException(error, `Error renaming collection ${newCollectionName} to ${collectionName}`)
      throw error
    }
  }

  async getStudents(): Promise<DbAppStudent[]> {
    return this.db.collection<DbAppStudent>(MONGODB.COLLECTIONS.STUDENTS).find().toArray()
  }

  async replaceStudents(students: (DbAppStudent | NewAppStudent)[]): Promise<void> {
    const encryptedStudents: DbEncryptedAppStudent[] = []

    for (const student of students) {
      const encryptedHasBlockedAddress: Binary = await this.encryptValue(student.hasBlockedAddress ?? false)

      encryptedStudents.push({
        ...student,
        _id: "_id" in student ? student._id : new ObjectId(),
        hasBlockedAddress: encryptedHasBlockedAddress
      })
    }

    await this.replaceCollection<DbEncryptedAppStudent>(MONGODB.COLLECTIONS.STUDENTS, encryptedStudents)
  }

  async getUsers(): Promise<DbAppUser[]> {
    return this.db.collection<DbAppUser>(MONGODB.COLLECTIONS.USERS).find().toArray()
  }

  async replaceUsers(users: (DbAppUser | NewAppUser)[]): Promise<void> {
    await this.replaceCollection<DbAppUser | NewAppUser>(MONGODB.COLLECTIONS.USERS, users)
  }

  async getAccess(): Promise<DbAccess[]> {
    return this.db.collection<DbAccess>(MONGODB.COLLECTIONS.ACCESS).find().toArray()
  }

  async replaceAccess(accesses: (DbAccess | NewDbAccess)[]): Promise<void> {
    await this.replaceCollection<DbAccess | NewDbAccess>(MONGODB.COLLECTIONS.ACCESS, accesses)
  }

  async getSchools(): Promise<DbSchool[]> {
    return this.db.collection<DbSchool>(MONGODB.COLLECTIONS.SCHOOLS).find().toArray()
  }

  async replaceSchools(schools: (DbSchool | NewSchool)[]): Promise<void> {
    await this.replaceCollection<DbSchool | NewSchool>(MONGODB.COLLECTIONS.SCHOOLS, schools)
  }

  async getEmailAlertsToHandle(): Promise<DbEmailAlert[]> {
    try {
      return await this.db.collection<DbEmailAlert>(MONGODB.COLLECTIONS.EMAIL_ALERTS).find({ status: "QUEUED" }).toArray()
    } catch (error) {
      logger.errorException(error, "Error fetching email alerts to handle")
      return []
    }
  }

  async updateEmailAlert(updatedAlert: DbEmailAlert): Promise<void> {
    try {
      await this.db.collection<DbEmailAlert>(MONGODB.COLLECTIONS.EMAIL_ALERTS).updateOne({ _id: updatedAlert._id }, { $set: { ...updatedAlert } })
      logger.info("Updated EmailAlert with Id {EmailAlertId}", updatedAlert._id.toString())
    } catch (error) {
      logger.errorException(error, "Error updating email alert with Id {EmailAlertId}. UpdatedAlert: {@UpdatedAlert}", updatedAlert._id.toString(), updatedAlert)
      throw error
    }
  }

  async ensureIndexes(): Promise<void> {
    try {
      await this.db.collection<DbStudentImportantStuff | DbGroupImportantStuff>(MONGODB.COLLECTIONS.IMPORTANT_STUFF).createIndexes([
        {
          key: { "student._id": 1, "school.schoolNumber": 1 },
          name: "idx_student_school",
          partialFilterExpression: { "student._id": { $exists: true } },
          unique: true
        },
        {
          key: { "group.systemId": 1, "school.schoolNumber": 1 },
          name: "idx_group_school_unique",
          partialFilterExpression: { "group.systemId": { $exists: true } },
          unique: true
        }
      ])
    } catch (error) {
      logger.errorException(error, "Error ensuring indexes on ImportantStuff collection")
      throw error
    }

    try {
      await this.db.collection<DbStudentDocument | DbGroupDocument>(MONGODB.COLLECTIONS.DOCUMENTS).createIndexes([
        { key: { "student._id": 1, "school.schoolNumber": 1, documentAccess: 1 }, name: "idx_student_school_access", partialFilterExpression: { "student._id": { $exists: true } } },
        { key: { "template._id": 1 }, name: "idx_template" }
      ])
    } catch (error) {
      logger.errorException(error, "Error ensuring indexes on Documents collection")
      throw error
    }

    try {
      await this.db.collection<DbStudentDataSharingConsent>(MONGODB.COLLECTIONS.STUDENT_DATA_SHARING_CONSENT).createIndex({ "student._id": 1 }, { name: "idx_student", unique: true })
    } catch (error) {
      logger.errorException(error, "Error ensuring indexes on Consent collection")
      throw error
    }

    try {
      await this.db.collection<DbAppUser>(MONGODB.COLLECTIONS.USERS).createIndex({ "entra.id": 1 }, { name: "idx_entraId", unique: true })
    } catch (error) {
      logger.errorException(error, "Error ensuring indexes on Users collection")
      throw error
    }

    try {
      await this.db.collection<DbSchool>(MONGODB.COLLECTIONS.SCHOOLS).createIndex({ schoolNumber: 1 }, { name: "idx_schoolNumber", unique: true })
    } catch (error) {
      logger.errorException(error, "Error ensuring indexes on Schools collection")
      throw error
    }
  }
}
