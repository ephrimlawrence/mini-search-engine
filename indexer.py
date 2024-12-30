import base64
from os import path

import tantivy
from pymongo import MongoClient
from tantivy import SnippetGenerator


def get_database():
    CONNECTION_STRING = "mongodb://localhost:27017"
    client = MongoClient(CONNECTION_STRING)

    return client["search_engine"]


def build_index(index: tantivy.Index):
    collection = get_database()["websites"]

    domains: list[str] = open("./domains.txt", "r").readlines()
    for domain in domains:
        writer = index.writer(num_threads=0)
        results = collection.find({"domain": domain.strip()})

        for d in results:
            # print(str(d["_id"].binary.hex()))
            # print(str(d["_id"].binary.hex()))
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


# Declaring our schema.
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
# build_index(index)

index.reload()
searcher = index.searcher()

query = index.parse_query("Create and manipulate matrix objects", ["title", "content"])
snippet_generator = SnippetGenerator.create(searcher, query, schema, "content")

hits = searcher.search(query, 10).hits
for h in hits:
    (best_score, best_doc_address) = h
    best_doc = searcher.doc(best_doc_address)
    # print(best_doc.to_dict())

    snippet = snippet_generator.snippet_from_doc(best_doc)
    # highlights = snippet.highlighted()
    # print(highlights)
    print(snippet.to_html())
# print(hits)
# print(best_score, best_doc_address)
# assert best_doc["title"] == ["The Old Man and the Sea"]
