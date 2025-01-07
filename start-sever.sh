#!/usr/bin/sh

gunicorn --bind 127.0.0.1:8000 app:app
