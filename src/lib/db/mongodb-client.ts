import { logger } from "@vestfoldfylke/loglady"
import { type Db, type Document, MongoClient, ObjectId, type OptionalUnlessRequiredId, type WithId } from "mongodb"
import { MONGODB } from "../../config.js"
import type { IDbClient } from "../../types/db/db-client.js"
import type { DbAccess, DbAppStudent, DbAppUser, DbEmailAlert, DbSchool, NewAppStudent, NewAppUser, NewDbAccess, NewSchool } from "../../types/db/shared-types.js"

export class MongoDbClient implements IDbClient {
  private readonly mongoClient: MongoClient
  private db: Db | null = null

  constructor() {
    if (!MONGODB.CONNECTION_STRING) {
      throw new Error("MONGODB_CONNECTION_STRING is not set (du har glemt den)")
    }

    this.mongoClient = new MongoClient(MONGODB.CONNECTION_STRING)
  }

  private async getDb(): Promise<Db> {
    if (this.db) {
      return this.db
    }

    try {
      await this.mongoClient.connect()
      this.db = this.mongoClient.db(MONGODB.DB_NAME)
      return this.db
    } catch (error) {
      logger.errorException(error, "Error when connecting to MongoDB")
      throw error
    }
  }

  private async replaceCollection<T extends Document>(collectionName: string, items: OptionalUnlessRequiredId<T>[]): Promise<void> {
    const db = await this.getDb()
    const collections = await db.listCollections().toArray()

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
        await db.collection(previousCollectionName).rename(newCollectionName)
        logger.info("Renamed collection {PreviousCollectionName} to {NewCollectionName}", previousCollectionName, newCollectionName)
      } catch (error) {
        logger.errorException(error, `Error renaming collection ${previousCollectionName} to ${newCollectionName}`)
        throw error
      }
    }

    // Now, insert into collection
    try {
      const collection = db.collection<T>(newCollectionName)

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
        await db.collection(collectionName).rename(previousCollectionName)
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
        await db.collection(collectionName).deleteMany({})

        return
      } catch (error) {
        logger.errorException(error, `Error renaming collection ${newCollectionName} to ${collectionName}`)
        throw error
      }
    }

    try {
      logger.info("Renaming collection {NewCollectionName} to {CollectionName}", newCollectionName, collectionName)
      await db.collection(newCollectionName).rename(collectionName)
      logger.info("Renamed collection {NewCollectionName} to {CollectionName}", newCollectionName, collectionName)
    } catch (error) {
      logger.errorException(error, `Error renaming collection ${newCollectionName} to ${collectionName}`)
      throw error
    }
  }

  async getStudents(): Promise<DbAppStudent[]> {
    const db = await this.getDb()
    return db.collection<DbAppStudent>(MONGODB.COLLECTIONS.STUDENTS).find().toArray()
  }

  async replaceStudents(students: (DbAppStudent | NewAppStudent)[]): Promise<void> {
    await this.replaceCollection<DbAppStudent | NewAppStudent>(MONGODB.COLLECTIONS.STUDENTS, students)
  }

  async getUsers(): Promise<DbAppUser[]> {
    const db = await this.getDb()
    return db.collection<DbAppUser>(MONGODB.COLLECTIONS.USERS).find().toArray()
  }

  async replaceUsers(users: (DbAppUser | NewAppUser)[]): Promise<void> {
    await this.replaceCollection<DbAppUser | NewAppUser>(MONGODB.COLLECTIONS.USERS, users)
  }

  async getAccess(): Promise<DbAccess[]> {
    const db = await this.getDb()
    return db.collection<DbAccess>(MONGODB.COLLECTIONS.ACCESS).find().toArray()
  }

  async replaceAccess(accesses: (DbAccess | NewDbAccess)[]): Promise<void> {
    await this.replaceCollection<DbAccess | NewDbAccess>(MONGODB.COLLECTIONS.ACCESS, accesses)
  }

  async getSchools(): Promise<DbSchool[]> {
    const db = await this.getDb()
    return await db.collection<DbSchool>(MONGODB.COLLECTIONS.SCHOOLS).find().toArray()
  }

  async replaceSchools(schools: (DbSchool | NewSchool)[]): Promise<void> {
    await this.replaceCollection<DbSchool | NewSchool>(MONGODB.COLLECTIONS.SCHOOLS, schools)
  }

  async getEmailAlertsToHandle(): Promise<DbEmailAlert[]> {
    try {
      const db: Db = await this.getDb()

      return await db.collection<DbEmailAlert>(MONGODB.COLLECTIONS.EMAIL_ALERTS).find({ status: "QUEUED" }).toArray()
    } catch (error) {
      logger.errorException(error, "Error fetching email alerts to handle")
      return []
    }
  }

  async updateEmailAlert(updatedAlert: DbEmailAlert): Promise<void> {
    try {
      const db: Db = await this.getDb()

      await db.collection<DbEmailAlert>(MONGODB.COLLECTIONS.EMAIL_ALERTS).updateOne({ _id: updatedAlert._id }, { $set: { ...updatedAlert } })
      logger.info("Updated EmailAlert with Id {EmailAlertId}", updatedAlert._id.toString())
    } catch (error) {
      logger.errorException(error, "Error updating email alert with Id {EmailAlertId}. UpdatedAlert: {@UpdatedAlert}", updatedAlert._id.toString(), updatedAlert)
      throw error
    }
  }

  async getStudentNameById(studentId: string): Promise<string | null> {
    try {
      const db: Db = await this.getDb()

      const student: WithId<DbAppStudent> | null = await db.collection<DbAppStudent>(MONGODB.COLLECTIONS.STUDENTS).findOne({ _id: new ObjectId(studentId) })
      if (!student) {
        logger.error("Student with Id {StudentId} not found", studentId)
        return null
      }

      return student.name
    } catch (error) {
      logger.errorException(error, "Error fetching student with Id {StudentId}", studentId)
      throw error
    }
  }
}

/* Manuelle elever - de kommer ikke fra FINT. Så hvis vi wiper, må vi lagre dem et sted */
