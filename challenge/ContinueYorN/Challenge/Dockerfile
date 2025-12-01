# Stage 1: Builder
# This stage is responsible for installing build tools and compiling the sensitive binary.
FROM node:18-slim AS builder

RUN apt-get update && \
    apt-get install -y sqlite3 gcc && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. COPY the source file needed for compilation
COPY readflag.c .

# 2. Compile it and set SUID bit
RUN gcc -o readflag readflag.c && \
    chmod 4755 readflag

# 3. Copy package files and install dependencies (can be cached)
COPY package*.json .
RUN npm install

# --- End of Builder Stage ---

# Stage 2: Production
# This stage only includes the necessary runtime and the compiled binary.
FROM node:18-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y sqlite3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependencies and install
COPY package*.json .
RUN npm install

# Copy only the compiled binary from the builder stage
COPY --from=builder /app/readflag /usr/local/bin/readflag
RUN chown root:root /usr/local/bin/readflag

# Copy the rest of your app files, excluding readflag.c via .dockerignore
# NOTE: The source file readflag.c might re-enter here if the .dockerignore file is missing or incorrect.
COPY . .

# EXPLICITLY REMOVE THE SOURCE FILE AFTER COPYING (if it was copied in the step above)
# This serves as a safety net against an incorrect .dockerignore configuration.
RUN rm -f readflag.c

RUN mkdir -p uploads && chown -R node:node uploads
RUN chown -R node:node /app

USER node

EXPOSE 4002
CMD [ "node", "index.js" ]