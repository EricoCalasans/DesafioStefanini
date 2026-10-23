FROM node:24-alpine

ENV NODE_ENV=production PORT=4173
WORKDIR /app

COPY --chown=node:node server.mjs ./server.mjs
COPY --chown=node:node public ./public

USER node
EXPOSE 4173

CMD ["node", "server.mjs"]
