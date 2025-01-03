FROM python:3.12-slim

WORKDIR /app

ADD requirements.txt /app
RUN pip install --no-cache-dir -r requirements.txt

ARG B2_APP_KEY
ARG B2_APP_ID

# Pull latest index for backblaze bucket
# RUN b2 account authorize $B2_APP_ID $B2_APP_KEY
# RUN b2 file download b2://search-engine-index/index.tar.gz /tmp && \
#     tar -xzf /tmp/index.tar.gz && \
#     rm /tmp/index.tar.gz

ADD app.py /app
ADD indexer.py /app
ADD templates /app/templates

EXPOSE 80

RUN pip show gunicorn

CMD ["gunicorn", "--bind", "0.0.0.0:80", "app:app"]
