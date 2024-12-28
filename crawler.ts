// @ts-check

import { Website, pageTitle } from "@spider-rs/spider-rs";
import { readFileSync } from "node:fs";

const domains: string[] = readFileSync(`${__dirname}/domains.txt`, "utf-8")
	.split("\n")
	.map((domain) => domain.trim());

// read domains from file
// const domains: string[] = readFileSync(`${__dirname}/domains.txt`, "utf-8")
console.log(domains);
async function run() {
	const website = new Website("https://rsseau.fr")
		.withHeaders({
			authorization: "somerandomjwt",
		})
		.withBudget({
			"*": 20, // limit max request 20 pages for the website
		})
		.withBlacklistUrl(["/resume"]) // regex or pattern matching to ignore paths
		.build();

	// optional: page event handler
	const onPageEvent = (_err, page) => {
		const title = pageTitle(page); // comment out to increase performance if title not needed
		console.info(`Title of ${page.url} is '${title}'`);
		website.pushData({
			status: page.statusCode,
			html: page.content,
			url: page.url,
			title,
		});
	};

	await website.crawl(onPageEvent);
	await website.exportJsonlData("./storage/rsseau.jsonl");
	console.log(website.getLinks());
}

// run();
