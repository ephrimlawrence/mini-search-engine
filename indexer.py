import argparse
import time
from os import getenv, path

import tantivy
from dotenv import load_dotenv
from pymongo import MongoClient
from tantivy import SnippetGenerator


def get_database():
    load_dotenv()

    CONNECTION_STRING = f"mongodb://{getenv("DB_URL", 'localhost:27017')}"
    client = MongoClient(CONNECTION_STRING)

    return client["search_engine"]


def build_index(index: tantivy.Index):
    collection = get_database()["websites"]

    domains: list[str] = open("./domains.txt", "r").readlines()
    for domain in domains:
        writer = index.writer(num_threads=0)
        results = collection.find({"domain": domain.strip()})

        for d in results:
            writer.add_document(
                tantivy.Document(
                    doc_id=d["_id"].binary.hex(),
                    title=[d.get("title")],
                    content=[d.get("content")],
                    url=[d.get("url")],
                )
            )

        writer.commit()
        writer.wait_merging_threads()


# Define schema
schema_builder = tantivy.SchemaBuilder()
schema_builder.add_text_field("title", stored=True, tokenizer_name="en_stem")
schema_builder.add_text_field("content", stored=True, tokenizer_name="en_stem")
schema_builder.add_text_field(
    "doc_id",
    stored=True,
    tokenizer_name="raw",
    index_option="basic",
    fast=True,  # type: ignore
)
schema_builder.add_text_field(
    "url",
    stored=True,
    tokenizer_name="raw",
    index_option="basic",
    fast=True,  # type: ignore
)
schema = schema_builder.build()

# Creating our index
index = tantivy.Index(schema, path=path.abspath("index"))


def perform_search(q: str):
    searcher = index.searcher()
    query = index.parse_query(q, ["title", "content"])
    snippet_generator = SnippetGenerator.create(searcher, query, schema, "content")

    start_time = time.time()
    hits = searcher.search(query, 10).hits
    end_time = time.time()

    results = []
    for h in hits:
        (_, best_doc_address) = h
        best_doc = searcher.doc(best_doc_address)
        snippet = snippet_generator.snippet_from_doc(best_doc)

        d = best_doc.to_dict()
        results.append(
            {"title": d["title"][0], "snippet": snippet.to_html(), "url": d["url"][0]}
        )

    return (results, end_time - start_time)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Indexing and Search Script")
    parser.add_argument("--build", action="store_true", help="Build the index")
    args = parser.parse_args()

    if args.build:
        build_index(index)

    index.reload()

    print("Performing search....")

    (results, latency) = perform_search("why use vuejs")

    print(f"completed in {latency}ms")
    for r in results:
        print(f" {r["title"].strip()}")
        print(f"    {r["snippet"].strip()}")
        print(f"    {r["url"].strip()}")
        print("---" * 10)
