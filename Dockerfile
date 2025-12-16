# To build the image, run
# docker build -t md2pdf .

# To run this container, type:
# docker run --rm -v "$PWD":/workspaces -w /workspaces md2html <input-file> -o <output-path>

# Use the official Puppeteer image which includes Node.js and Chromium
FROM ghcr.io/puppeteer/puppeteer:latest

# Create a dedicated non-root user/group

# Create the work directory and ensure our user owns it
WORKDIR /app

# Copy dependency manifests first (for better build caching)
COPY package*.json ./

# Install dependencies (including Puppeteer)
RUN yarn

# Copy the rest of the source
COPY tsconfig.json ./
COPY src ./src

# Build the TypeScript code
RUN yarn run build

EXPOSE 8080

# Default command: just show help; we’ll override in docker run
ENTRYPOINT ["node", "/app/dist/server.js"]

