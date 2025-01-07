# Mini Search Engine

This project is a mini search engine implemented using [Tantivy](https://github.com/quickwit-oss/tantivy) search engine library and [Spider](https://github.com/spider-rs/spider-nodejs) crawler.

Live demo at [http://188.245.218.102/](http://188.245.218.102/)

## Project Structure

> The project is written in two languages (NodeJS/Typescript and Python). Although could have been only Python, but [Spider (python)](https://github.com/spider-rs/spider-py) has incompatible dependencies. Spider-nodejs was instead used for the crawler, hence nodeJs.

The crawler is written in ts, with the spider-nodejs package and [html-to-text](https://www.npmjs.com/package/html-to-text) for extracting the page text content. The text content is stored in MongoDB, which is later indexed (`indexer.py`) with Tantivy for search. Domains to crawl are in the `domains.txt`.

## Setup

### Prerequisites
The following packages must be available installed:

* [Python 3.12+](https://www.python.org/downloads/)
* [NodeJS 22+](https://nodejs.org/en/download)
* [MongoDB](https://www.mongodb.com/docs/manual/installation/)
* [Chromium or Google Chrome](https://www.chromium.org/getting-involved/download-chromium/)

### Installing deps

* Install node packages
	```sh
	npm install
	```
* Install python packages, assuming [venv](https://docs.python.org/3/library/venv.html) has already been setup and activated
	```sh
	pip install -r requirements.txt
	```

### Running the crawler

The domains (166) to crawl are in the `domains.txt`.  Based on the number of system CPU cores, `n` number of workers are started, each crawls one domain at a time.
By default, the crawler is limited to only `1000` pages per domain, to reduce bandwidth usage (and because my slow computer). However, this value can be modified in `worker.ts`, `PAGE_LIMIT` constant.

Run the command below to start the crawler.

```sh
npm run crawl
```

### Web Interface

Run this command to start the flask server. Access the search interface at [http://127.0.0.1:5000](http://127.0.0.1:5000)

```sh
flask run --reload --debug
```

### Building the index

The crawled content is stored in a mongodb. Indexing simply copies the data into a tantivy index.
Run the command below to re-build the search index.

```sh
python indexer.py --build
```

Use `npm run publish-index` to upload the index to a backblaze (for production deployment). Backblze can be replaced with storage service of your choice.

Production index can be downloaded from [here](http://188.245.218.102/download-index).


### Deployment

The tricky bit is deploying the index, since tantivy's index is stored in files. Few options comes to mind; (1) add the index to git, while easy, leads to huge repo size, (2) deploy to external storage service (s3, backbaze, etc) and pull in production build, (3) use a shared volume on the server (availabe only on dedicated VPS?), or (4) rebuild the index in production (can slow down the server if index size is very large?).


* Docker:
A `Dockerfile` file is included in the project for deployment on any platform that support docker. The index is pulled from [backbaze](https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.backblaze.com/) bucket (can be replaced with S3, etc) during build.
* [PM2](https://pm2.keymetrics.io/)

    ```sh
    pm2 start start-sever.sh --name search-engine
    ```

## Crawler

There are several web crawlers to choose from - [NodeJs Crawler v2](https://www.npmjs.com/package/crawler), [Crawlee](https://crawlee.dev/python/api), [Spider](https://github.com/spider-rs/spider-nodejs) and [Scrapy](https://docs.scrapy.org/en/latest) among others. However, [Spider (nodejs)](https://github.com/spider-rs/spider-nodejs) was ultimately selected as the crawler for the project. This decision was based on the [benchmarks](https://github.com/spider-rs/spider-nodejs?tab=readme-ov-file#benchmarks) and the simplicity of its API as compared to the other crawlers. Spider supports headless chrome crawling for JS, although this feature was not used in testing.

## Indexing

[Tantivy](https://github.com/quickwit-oss/tantivy) was selected instead of ([Vesp](https://docs.vespa.ai/en/getting-started.html). Although Vespa has many features and well documented (?), its configuration is complicated, making it suiteable for probably large projects with complex requirements.
Tantivy, on the other hand, has a very simple yet powerful API interface, little configuration and very fast - making it suitable for the project. Vespa is kinda overkill for the project.

### Ranking
Tantivy uses the BM25 algorithm for scoring documents based on their relevance to a given query. BM25 is a probabilistic information retrieval function that considers both the frequency of query terms within a document (TF) and the inverse document frequency (IDF) of those terms across the entire collection. This approach effectively balances the importance of frequent terms within a document while also accounting for the overall rarity of those terms in the corpus.

Having properly defined the schema, the rest is handled by tantivy.

## Proxies

There are [SaSS proxy services](https://medium.com/zenrows/web-scraping-proxy-bd30a219e265) - ([Oxylabs](https://oxylabs.io/products/socks5-proxies), [Bright Data](https://brightdata.com/), etc) can be used to prevent IP blocking and detection.

## Challenges

* Extracting text content from web pages:
Even though [html-to-text](https://www.npmjs.com/package/html-to-text) package is reasonably good at extracting text content from a page, it nevertheless leaves a lot to be desired. For instance, links are represented like `[https://discord.gg/yarnpkg]` in the final output. I understand that this is a hard problem, and no one library can solve all the edge cases.

Some sites such as https://yarnpkg.com has duplicate text, eg.  "Skip to main content
Yarn Logo..." in the body of almost all the pages. I think this can only be solved by analyzing the duplicated text parterns and implement a filter to remove them.  

* Crawling speed
Crawling all pages really took a long time, even limited to 1000 pages per domain. It is even get worse when running in headless chrome. This probably is due to my limited bandwidth speed and slow computer. I implemented multi-core crawling to mitigate the problem but bandwidth speed was still a problem.

* Thousands of 404s
After crawling 111, 989 pages across all the domains. There were 6088 pages that were not found, and were removed from the dataset.

* Unscrappable domains without headless chrome
Some domains like angular.io are impossible to scrap without headless chrome. Oddly, this  causes the crawler to hang, because the page doesn't contain any link?

* Internal library bugs
  Spide-nodejs most often do not exit after crawling a domain in headless mode, unless terminated manually. 
  MongoDB often throws unique `_id` error on insert, which is very odd because `_id` is automatically generated. This is probably a race condition bug.
