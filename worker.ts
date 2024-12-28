import { Website, pageTitle } from "@spider-rs/spider-rs";
const process = require("node:process");
const { convert } = require('html-to-text');

const domain = process.env.DOMAIN || "vercel.com";

async function run() {
	console.log(`crawling domain ${domain}`);
	const website = new Website(domain)
		.withBudget({
			// "*": 10000, // limit to 10k pages per domain
			"*": 2,
		})
		.withStealth()
		.build();

	// optional: page event handler
	const onPageEvent = (_err, page) => {
		const title = pageTitle(page);
		console.info(`Title of ${page.url} is '${title}'`);
		console.log({
			status: page.statusCode,
			html: convert(page.content),
			url: page.url,
			title,
		});
		website.pushData({
			status: page.statusCode,
			html: page.content,
			url: page.url,
			title,
		});
	};

	await website.crawl(onPageEvent);
	await website.exportJsonlData("./rsseau.jsonl");
	console.log(website.getLinks());

	console.log("done here");
	process.exit(0);
	// process.send({ type: "done", domain: domain });
}

run();
