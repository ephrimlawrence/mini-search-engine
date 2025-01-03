FROM python:3.12-slim

WORKDIR /app

ADD requirements.txt /app
RUN pip install --no-cache-dir -r requirements.txt

ADD app.py /app
ADD indexer.py /app
ADD templates /app

# Make port 80 available to the world outside this container
EXPOSE 80

ARG B2_APP_KEY
ARG B2_APP_ID

# Pull latest index for backblaze bucket
RUN b2 account authorize $B2_APP_ID $B2_APP_KEY
RUN b2 file download b2://search-engine-index/index.tar.gz /tmp
RUN tar -xzf /tmp/index.tar.gz -C /app/index
RUN ls -alh /app/index

# Run app.py when the container launches
CMD ["gunicorn", "app:app"]
