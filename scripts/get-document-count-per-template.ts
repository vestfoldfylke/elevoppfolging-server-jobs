import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { type Db, MongoClient, type WithId } from "mongodb";
import type { DocumentContentTemplate, StudentDocument } from "../src/types/db/shared-types.js";

type DbDocumentContentTemplateTemp = Omit<DocumentContentTemplate, "_id">;

type DbStudentDocumentTemp = Omit<StudentDocument, "_id">;

type TemplateUsage = {
  [key: string]: number;
};

const folderPath: string = "./usage";
const outputPath: string = `${folderPath}/document-count-per-template.json`;

const connectionString: string | undefined = process.env.MONGODB_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("Environment variable MONGODB_CONNECTION_STRING is missing");
}

const dbName: string | undefined = process.env.MONGODB_DB_NAME;
if (!dbName) {
  throw new Error("Environment variable MONGODB_DB_NAME is missing");
}

const documentsCollectionName: string | undefined = process.env.MONGODB_DOCUMENTS_COLLECTION_NAME;
if (!documentsCollectionName) {
  throw new Error("Environment variable MONGODB_DOCUMENTS_COLLECTION_NAME is missing");
}

const templatesCollectionName: string | undefined = process.env.MONGODB_TEMPLATES_COLLECTION_NAME;
if (!templatesCollectionName) {
  throw new Error("Environment variable MONGODB_TEMPLATES_COLLECTION_NAME is missing");
}

const mongoDb: Db = new MongoClient(connectionString).db(dbName);

const documents: WithId<DbStudentDocumentTemp>[] = await mongoDb.collection<DbStudentDocumentTemp>(documentsCollectionName).find({}).toArray();
console.log("Found", documents.length, "documents");
const templates: WithId<DbDocumentContentTemplateTemp>[] = await mongoDb.collection<DbDocumentContentTemplateTemp>(templatesCollectionName).find({}).toArray();
console.log("Found", templates.length, "templates");

const templateUsageById: TemplateUsage = {};

for (const document of documents) {
  const templateId: string = document.template._id.toString();
  if (!Number.isInteger(templateUsageById[templateId])) {
    templateUsageById[templateId] = 0;
  }

  templateUsageById[templateId]++;
}
console.log("Found", Object.keys(templateUsageById).length, "template usages by id");

const templateUsageByName: TemplateUsage = {};

for (const [templateId, templateCount] of Object.entries(templateUsageById)) {
  const templateName: string | undefined = templates.find((template: WithId<DbDocumentContentTemplateTemp>) => template._id.toString() === templateId)?.name
  if (!templateName) {
    console.error(`[WARN] Template name for template with id ${templateId} not found. Will use _id instead`)
  }

  templateUsageByName[templateName ?? templateId] = templateCount;
}
console.log("Found", Object.keys(templateUsageByName).length, "template usages by name\n");

const templateUsageSorted: TemplateUsage = Object.fromEntries(
  Object.entries(templateUsageByName).sort(([_, aCount], [__, bCount]) => aCount < bCount ? 1 : -1)
)

for (const template of templates) {
  if (Number.isInteger(templateUsageById[template._id.toString()])) {
    continue;
  }

  templateUsageSorted[template.name] = 0;
  console.warn(`${template.name} is not used at all`);
}

if (!existsSync(folderPath)) {
  mkdirSync(folderPath);
}

console.log("\nWriting to", outputPath);
writeFileSync(outputPath, JSON.stringify(templateUsageSorted, null, 2), "utf8");
console.log("Written to", outputPath);

process.exit(0);
