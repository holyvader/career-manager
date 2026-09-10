#!/bin/sh
set -eu

mkdir -p /etc/nginx/certs
if [ ! -s /etc/nginx/certs/localhost.key ] || \
   ! openssl x509 -checkend 86400 -noout -in /etc/nginx/certs/localhost.crt 2>/dev/null; then
  umask 077
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout /etc/nginx/certs/localhost.key \
    -out /etc/nginx/certs/localhost.crt \
    -subj '/CN=localhost' \
    -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1'
fi
