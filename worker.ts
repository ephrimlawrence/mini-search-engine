import { type NPage, Website, pageTitle } from "@spider-rs/spider-rs";
import { db } from "./database";
import Crawler from "crawler";
const process = require("node:process");
const { convert } = require("html-to-text");

const domain = process.env.DOMAIN || "developer.mozilla.org";
const PAGE_LIMIT = 10000

async function run() {
	console.log(`crawling domain ${domain}`);

	const crawledPages: Array<{ url: string, title: string, domain: string, content: string, statusCode: number }> = []
	let count = 0;

	const website = new Website(domain)
		.withBudget({
			"*": PAGE_LIMIT, // limit to 10k pages per domain
		})
		.withDepth(0)
		.withStealth(true)
		.withChromeIntercept(true, true)
		.withRespectRobotsTxt(true)
		.withCaching(true)
		.withWaitForDelay(2, 500)
		.build();

	// optional: page event handler
	const onPageEvent = async (_err, page: NPage) => {
		const title = pageTitle(page);
		if (page.statusCode === 200) {
			// console.log(`Title: ${title}`);
			crawledPages.push({
				statusCode: page.statusCode,
				content: convert(page.content),
				url: page.url,
				title,
				domain: domain,
			})
		}
	};

	await website.crawl(onPageEvent, false, true);

	if (crawledPages.length > 0) {
		// await db.collection("websites").deleteMany({ domain: domain })
		await db.collection("websites").insertMany(crawledPages)
	}

	// process.exit(0);
	process.send({ type: "done", domain: domain });
}

run();
