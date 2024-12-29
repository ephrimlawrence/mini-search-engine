import { Website, pageTitle } from "@spider-rs/spider-rs";
import { DB } from "./database";
const process = require("node:process");
const { convert } = require("html-to-text");

const domain = process.env.DOMAIN || "angular.io";

async function run() {
	console.log(`crawling domain ${domain}`);
	const website = new Website(domain)
		.withBudget({
			"*": 10000, // limit to 10k pages per domain
			// "*": 2,
		})
		.withStealth()
		.build();

	// optional: page event handler
	const onPageEvent = async (_err, page) => {
		const title = pageTitle(page);
		// console.info(`Title of ${page.url} is '${title}'`);

		await DB.any(
			`
			INSERT INTO websites (title, url, domain, content) VALUES($1:raw, $2, $3, $4:raw)
			ON CONFLICT (url) DO UPDATE SET content = EXCLUDED.content
			`,
			["$$" + title + "$$", page.url, domain, "$$" + convert(page.content) + "$$"],
		);

		// website.pushData({
		// 	status: page.statusCode,
		// 	html: page.content,
		// 	url: page.url,
		// 	title,
		// });
	};

	await website.crawl(onPageEvent);
	await website.exportJsonlData(`./storage/${domain}.jsonl`);
	// console.log(website.getLinks());

	// process.exit(0);
	process.send({ type: "done", domain: domain });
}

run();
