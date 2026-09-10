FROM nginx:stable-alpine

RUN apk add --no-cache openssl
COPY default.conf /etc/nginx/conf.d/default.conf
COPY 15-local-cert.sh /docker-entrypoint.d/15-local-cert.sh
RUN chmod +x /docker-entrypoint.d/15-local-cert.sh
