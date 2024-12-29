import { NPage, Website, pageTitle } from "@spider-rs/spider-rs";
import { db } from "./database";
import Crawler from "crawler";
const process = require("node:process");
const { convert } = require("html-to-text");

const domain = process.env.DOMAIN || "developer.mozilla.org";

async function run() {
	console.log(`crawling domain ${domain}`);

	const crawledPages: Array<{ url: string, title: string, domain: string, content: string }> = []
	const website = new Website(domain)
		.withBudget({
			"*": 5, // limit to 10k pages per domain
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
		// const p = await page.fetch();
		// const html = p.getHtml();
		// console.log(html);
		// console.log(convert(page.content))
		const title = pageTitle(page);
		console.info(`Title of ${page.url} is '${title}'`);
		if (page.statusCode === 200) {
			crawledPages.push({
				content: convert(page.content),
				url: page.url,
				title,
				domain: domain,
			})
		}

		// await DB.any(
		// 	`
		// 	INSERT INTO websites (title, url, domain, content) VALUES($1:raw, $2, $3, $4:raw)
		// 	ON CONFLICT (url) DO UPDATE SET content = EXCLUDED.content
		// 	`,
		// 	["$$" + title + "$$", page.url, domain, "$$" + convert(page.content) + "$$"],
		// );

		// website.pushData({
		// 	status: page.statusCode,
		// 	html: convert(page.content),
		// 	url: page.url,
		// 	title,
		// 	domain: domain,
		// });
	};

	await website.crawl(onPageEvent, false, true);

	await db.collection("websites").deleteMany({ domain: domain })
	await db.collection("websites").insertMany(crawledPages)
	// console.log(website.readData())
	// await website.exportJsonlData(`./storage/${domain}.jsonl`);
	// console.log(website.getLinks());

	process.exit(0);
	// process.send({ type: "done", domain: domain });
}

run();

async function run2() {
	const c = new Crawler({
		maxConnections: 20,
		rateLimit: 1000,
		// This will be called for each crawled page
		callback: (error, res, done) => {
			if (error) {
				console.log(error);
			} else {
				const $ = res.$;
				// $ is Cheerio by default
				//a lean implementation of core jQuery designed specifically for the server
				console.log($("title").text());
				console.log($("body").text());
			}
			console.log("Crawling done!");
			// done();
		},
	});
	c.add(domain);
}

// run2()
