FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

# Install production dependencies only by default; allow dev during build-time if needed
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN if [ "$NODE_ENV" = "production" ]; then npm ci --only=production; else npm install; fi

COPY . .

EXPOSE 5000

# Run the production start script
CMD ["npm", "run", "start"]
