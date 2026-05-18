FROM node:22-alpine
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY src/ src/

# Run payment listener
CMD ["node", "src/listener.js"]
