import { logger } from "@vestfoldfylke/loglady"
import { type Db, Document, MongoClient, type OptionalUnlessRequiredId } from "mongodb"
import { MONGODB } from "../../config.js"
import type { IDbClient } from "../../types/db/db-client.js"
import type { DbAccess, DbAppStudent, DbAppUser, DbSchool, NewAccess, NewAppStudent, NewAppUser, NewSchool } from "../../types/db/shared-types.js"

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
      logger.error(`Both ${previousCollectionName} and ${newCollectionName} exist. Manual intervention required. SEND TO JAIL! R og J må inn og fikse dette.`)
      throw new Error(`Both ${previousCollectionName} and ${newCollectionName} exist. Manual intervention required.`)
    }

    if (hasPrevious) {
      try {
        logger.info(`Renaming collection ${previousCollectionName} to ${newCollectionName}`)
        await db.collection(previousCollectionName).rename(newCollectionName)
        logger.info(`Renamed collection ${previousCollectionName} to ${newCollectionName}`)
      } catch (error) {
        logger.errorException(error, `Error renaming collection ${previousCollectionName} to ${newCollectionName}`)
        throw error
      }
    }

    // Now, insert into new collection
    try {
      const collection = db.collection<T>(newCollectionName)
      await collection.deleteMany({})
      await collection.insertMany(items)
      logger.info("Replaced collection {collectionName} with {itemCount} items", newCollectionName, items.length)
    } catch (error) {
      logger.errorException(error, "Error replacing collection {collectionName}", newCollectionName)
      throw error
    }

    // Finally, rename collections
    if (hasCurrent) {
      try {
        logger.info(`Renaming collection ${collectionName} to ${previousCollectionName}`)
        await db.collection(collectionName).rename(previousCollectionName)
        logger.info(`Renamed collection ${collectionName} to ${previousCollectionName}`)
      } catch (error) {
        logger.errorException(error, `Error renaming collection ${collectionName} to ${previousCollectionName}`)
        throw error
      }
    } else {
      logger.info(`No existing collection named ${collectionName} to rename to ${previousCollectionName}, will skip this step, and just create the new collection.`)
    }

    try {
      logger.info(`Renaming collection ${newCollectionName} to ${collectionName}`)
      await db.collection(newCollectionName).rename(collectionName)
      logger.info(`Renamed collection ${newCollectionName} to ${collectionName}`)
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

  async replaceAccess(accesses: (DbAccess | NewAccess)[]): Promise<void> {
    await this.replaceCollection<DbAccess | NewAccess>(MONGODB.COLLECTIONS.ACCESS, accesses)
  }

  async getSchools(): Promise<DbSchool[]> {
    const db = await this.getDb()
    return await db.collection<DbSchool>(MONGODB.COLLECTIONS.SCHOOLS).find().toArray()
  }

  async replaceSchools(schools: (DbSchool | NewSchool)[]): Promise<void> {
    await this.replaceCollection<DbSchool | NewSchool>(MONGODB.COLLECTIONS.SCHOOLS, schools)
  }
}

/* Manuelle elever - de kommer ikke fra FINT. Så hvis vi wiper, må vi lagre dem et sted */
