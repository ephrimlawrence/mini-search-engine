import { type NPage, Website, pageTitle } from "@spider-rs/spider-rs";
import { db } from "./database";
const process = require("node:process");
const { convert } = require("html-to-text");

const domain = process.env.DOMAIN;
const PAGE_LIMIT = 1000

async function run() {
	console.log(`crawling domain ${domain}`);

	let crawledPages: Array<{
		url: string, title: string, domain: string,
		content: string, statusCode: number, error: string | null
	}> = []
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

	const onPageEvent = async (_err, page: NPage) => {
		const title = pageTitle(page);
		let content = '';
		let error = null;

		try {
			content = convert(page.content)
		} catch (error) {
			error = error.message
		} finally {
			// console.log(`Title: ${title}`);
			crawledPages.push({
				statusCode: page.statusCode,
				content: content,
				url: page.url,
				title,
				domain: domain,
				error: error
			})
			count += 1

			// To reduce the number of db writes for each page crawled,
			// write data to db if 500 pages have to crawled.
			if (count === 500) {
				try {
					await db.collection("websites").insertMany(crawledPages)
				} catch (error) {
					console.log(error)
				}

				crawledPages = []
				count = 0
			}
		}
	};

	await website.crawl(onPageEvent, false, true);

	// 'insertMany' throw error if array is empty
	if (crawledPages.length > 0) {
		// await db.collection("websites").deleteMany({ domain: domain })
		try {
			await db.collection("websites").insertMany(crawledPages)
		} catch (error) {
			console.log(error)
		}
	}
	await db.collection("crawled_domains").insertOne({ domain, date: new Date() })

	// process.exit(0);

	// Notify parent process that we have finished crawling this domain
	process.send({ type: "done", domain: domain });
}

run();
