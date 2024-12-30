from os import path

import tantivy
from pymongo import MongoClient


def get_database():
    CONNECTION_STRING = "mongodb://localhost:27017"
    client = MongoClient(CONNECTION_STRING)

    return client["search_engine"]


def build_index(index: tantivy.Index):
    collection = get_database()["websites"]
    writer = index.writer()

    domains: list[str] = open("./domains.txt", "r").readlines()
    for domain in domains:
        results = collection.find({"domain": domain.strip()})
        for d in results:
            writer.add_document(
                tantivy.Document(
                    doc_id=str(d["_id"]),
                    title=[d["title"]],
                    body=[d["content"]],
                    url=[d["url"]],
                )
            )

    writer.commit()
    writer.wait_merging_threads()


# Declaring our schema.
schema_builder = tantivy.SchemaBuilder()
schema_builder.add_text_field("title", stored=True, tokenizer_name="en_stem")
schema_builder.add_text_field("content", stored=True, tokenizer_name="en_stem")
schema_builder.add_text_field("doc_id", stored=True, tokenizer_name="raw")
schema_builder.add_text_field("url", stored=True, tokenizer_name="raw")
schema = schema_builder.build()

# Creating our index
index = tantivy.Index(schema, path=path.abspath("index"))


build_index(index)
# writer = index.writer()
# writer.add_document(
#     tantivy.Document(
#         doc_id=1,
#         title=["The Old Man and the Sea"],
#         body=[
#             """He was an old man who fished alone in a skiff in the Gulf Stream and he had gone eighty-four days now without taking a fish."""
#         ],
#     )
# )
# writer.commit()
# writer.wait_merging_threads()
