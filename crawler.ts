import { readFileSync } from "node:fs";
import { setupDb } from "./database";
const cluster = require("node:cluster");
const numCPUs = require("node:os").availableParallelism();
const process = require("node:process");

if (cluster.isPrimary) {
	console.log(`Primary ${process.pid} is running`);

	setupDb();

	const domains: string[] = readFileSync(`${__dirname}/domains.txt`, "utf-8")
		.split("\n")
		.map((domain) => domain.trim());

	const crawledDomains: {
		[domain: string]: { worker: number | null; done: boolean };
	} = {};

	for (const domain of domains) {
		crawledDomains[domain] = { done: false, worker: null };
	}

	// Fork workers.
	for (let i = 0; i < numCPUs; i++) {
		const d = domains.pop();
		if (d != null && !crawledDomains[d].done) {
			const worker = cluster.fork({ DOMAIN: d });
			crawledDomains[d].worker = worker.id;
		}
	}

	cluster.on("message", (worker, message) => {
		if (message.type === "done") {
			const domain = message.domain;
			crawledDomains[domain] = { done: true, worker: null };
			console.log(`${domain} crawled successfully!`);

			// Fork a new worker with the next domain
			const d = domains.pop();
			if (d != null && !crawledDomains[d].done) {
				const newWorker = cluster.fork({ DOMAIN: d });
				crawledDomains[d].worker = newWorker.id;
			}
		}
	});

	cluster.on("exit", (worker, code, signal) => {
		console.log(`worker ${worker.process.pid} died`);
		// // console.log(code, signal, worker)
		// if (code === 0) {
		// 	// success
		//     console.log(worker.env)
		// 	const _d = worker.process.env.DOMAIN;
		// 	crawledDomains[_d] = { done: true, worker: null };
		// 	console.log(`${_d} crawled successfully!`);

		// 	// Fork a new worker with the next domain
		// 	const d = domains.pop();
		//     console.log(domains)
		// 	if (d != null && !crawledDomains[d].done) {
		// 		const worker = cluster.fork({ DOMAIN: d });
		// 		crawledDomains[d].worker = worker.id;
		// 	}
		// }
	});
} else {
	require("./worker");

	console.log(`\n--Worker ${process.pid} started`);
}
