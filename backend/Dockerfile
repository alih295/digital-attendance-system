# 1. Base image select karein
FROM node:18

# 2. Working directory set karein
WORKDIR /app

# 3. Dependencies copy aur install karein
COPY package*.json ./
RUN npm install

# 4. Baaki saara code copy karein
COPY . .

# 5. Port set karein (Hugging Face default 7860 use karta hai)
ENV PORT=7860
EXPOSE 7860

# 6. App start karne ki command
CMD ["node", "server.js"]