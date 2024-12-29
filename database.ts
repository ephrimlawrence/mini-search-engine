import pgPromise from "pg-promise";

const pgp = pgPromise({
	capSQL: true, // capitalize all generated SQL
	schema: ["public"],
});

export const DB = pgp({
	host: "localhost",
	port: 5432,
	database: "search_engine",
	user: process.env.POSTGRES_USERNAME || "ephrim",
	password: process.env.POSTGRES_PASSWORD,
});

export async function setupDb() {
	DB.none(`
        CREATE TABLE IF NOT EXISTS websites (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url TEXT NOT NULL UNIQUE,
            domain TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS websites_url_idx ON websites(url);
    `);
}

setupDb();
