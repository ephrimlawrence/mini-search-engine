from flask import Flask, render_template, request

from indexer import index, perform_search

app = Flask(__name__)
index.reload()


@app.route("/")
def hello_world():
    query = request.args.get("q")
    results = []
    if query is not None:
        results = perform_search(query)
        # print(results)
    else:
        query = ""

    return render_template("index.html", results=results, query=query)
