from flask import Flask, render_template, request

from indexer import get_database, index, perform_search

app = Flask(__name__)
index.reload()


@app.route("/")
def search():
    query = request.args.get("q")
    results = []
    latency = None
    if query is not None:
        (results, latency) = perform_search(query)
    else:
        query = ""

    return render_template("index.html", results=results, query=query, latency=latency)


@app.route("/stats")
def stats():
    collection = get_database()["websites"]

    # add counting of total records to the mongodb query pipeline below
    pipeline = [
        {"$group": {"_id": "$domain", "pages_crawled": {"$sum": 1}}},
        {"$sort": {"pages_crawled": -1}},
    ]
    total = collection.estimated_document_count()

    return render_template(
        "stats.html", stats=list(collection.aggregate(pipeline)), total=total
    )
