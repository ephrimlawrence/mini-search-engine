// import pgPromise from "pg-promise";
import { Db, MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017")
export let db: Db;
// const pgp = pgPromise({
// 	capSQL: true, // capitalize all generated SQL
// 	schema: ["public"],
// });

// export const DB = pgp({
// 	host: "localhost",
// 	port: 5432,
// 	database: "search_engine",
// 	user: process.env.POSTGRES_USERNAME || "ephrim",
// 	password: process.env.POSTGRES_PASSWORD,
// });

export async function setupDb() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        db = client.db("search_engine");

        // Create a collection and an index
        await db.createCollection("websites");
        await db.collection("websites").createIndex({ url: 1 }, { unique: true });

        console.log("Database setup completed");
    } catch (error) {
        console.error("Error setting up the database:", error);
    }
}

setupDb();
