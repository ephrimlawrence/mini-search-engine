import { type Db, MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017")
export let db: Db;


export async function setupDb() {
    try {
        await client.connect();

        db = client.db("search_engine");

        // Create a collection and an index
        await db.createCollection("websites");
        // await db.collection("websites").createIndex({ url: 1 }, { unique: true });

        // console.log("Database setup completed");
    } catch (error) {
        console.error("Error setting up the database:", error);
    }
}

setupDb();
