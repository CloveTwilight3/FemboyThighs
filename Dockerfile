FROM node:25-alpine

# Install dependencies for audio processing including ffmpeg, yt-dlp and codecs
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    git \
    ffmpeg \
    opus \
    opus-dev \
    yt-dlp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Start the bot
CMD ["npm", "start"]
