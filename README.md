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

### Indexing

The crawled content is stored in a mongodb. Indexing simply copies the data into a tantivy index. 
Run the command below to re-build the search index. 

```sh
python indexer.py --build
```

### Deployment

* Docker:
A `Dockerfile` file is included in the project for deployment on any platform that support docker.
* [PM2](https://pm2.keymetrics.io/)
    ```sh
    pm2 start start-sever.sh --name search-engine
    ```

## Crawler

There are several web crawlers to choose from - [NodeJs Crawler v2](https://www.npmjs.com/package/crawler), [Crawlee](https://crawlee.dev/python/api), [Spider](https://github.com/spider-rs/spider-nodejs) and [Scrapy](https://docs.scrapy.org/en/latest) among others. However, [Spider (nodejs)](https://github.com/spider-rs/spider-nodejs) was ultimately chosen as the crawler for the project. This decision was based on the [benchmarks](https://github.com/spider-rs/spider-nodejs?tab=readme-ov-file#benchmarks) and the simplicity of its API as compared to the other crawlers. Spider supports headless chrome crawling,, although this feature was not used in testing.

## Indexing

[Tantivy](https://github.com/quickwit-oss/tantivy) was chosen instead of ([Vesp](https://docs.vespa.ai/en/getting-started.html). Although Vespa has many features and well documented (?), its configuration is complicated, making it suiteable for probably large projects with complex requirements. 
Tantivy, on the other hand, has a very simple yet powerful API interface, little configuration and very fast - making it suitable for the project. Vespa is kinda overkill for the project.

* discuss average search latency
* explain how to use proxy
* Prioritize both search relevancy and latency.
* Explain how you optimized ranking to achieve high relevancy in the search results.