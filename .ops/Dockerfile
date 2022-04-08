FROM node:12-alpine3.12 as builder

COPY ./code /opt/mitrachatbot

WORKDIR /opt/mitrachatbot

RUN npm install

FROM node:12-alpine3.12

LABEL maintainer="gunferzs"

COPY --from=builder /opt/mitrachatbot/node_modules /opt/mitrachatbot/node_modules
COPY ./code /opt/mitrachatbot

RUN chown -R 1488:1488 /opt/mitrachatbot

WORKDIR /opt/mitrachatbot

USER 1488

EXPOSE 8080

ENTRYPOINT ["/opt/mitrachatbot/startup.sh"]