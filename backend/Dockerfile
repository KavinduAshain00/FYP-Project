# Production-ready Dockerfile for backend (Node 20)
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies (use package-lock.json for reproducible installs)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Use non-root user for security
RUN chown -R node:node /usr/src/app
USER node

ENV PORT=5001
ENV MONGODB_URI=mongodb+srv://kavinduashaingo_db_user:KATpro2005@gamilearn.xkrrazj.mongodb.net/
ENV JWT_SECRET=1692f6d6ee76f79a7268f76f87802833
ENV OLLAMA_API_KEY=0fafadac1ddd4932a4181462eeb79e1c.mz00gNiM6I030l_APQsh1qzE

EXPOSE 5001

CMD ["node", "server.js"]
