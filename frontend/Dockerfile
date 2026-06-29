# Dev-oriented image for the Notes frontend.
FROM node:20-slim

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the application source.
COPY . .

EXPOSE 3000

# Run the Next.js dev server.
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
