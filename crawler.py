from crawlee.beautifulsoup_crawler import (
    BeautifulSoupCrawler,
    BeautifulSoupCrawlingContext,
)

crawler = BeautifulSoupCrawler()


# Define the default request handler, which will be called for every request.
@crawler.router.default_handler
async def request_handler(context: BeautifulSoupCrawlingContext) -> None:
    context.log.info(f"Processing {context.request.url} ...")

    # Extract data from the page.
    data = {
        "url": context.request.url,
        "title": context.soup.title.string if context.soup.title else None,
    }

    # Push the extracted data to the default dataset.
    await context.push_data(data)


crawler.run(["https://crawlee.dev/"])
