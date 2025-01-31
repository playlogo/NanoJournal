# Build ------------------------------------------- 
FROM oven/bun:1.1-alpine AS build
WORKDIR /app
    
RUN apk add --no-cache git
    
COPY . ./
COPY .git .
    
RUN bun install 
RUN bun run build
    
# Serve -------------------------------------------
FROM denoland/deno:alpine-2.1.4
    
EXPOSE 8000
    
WORKDIR /app
    
RUN apk add bash wget git curl python3 awake
    
# Copy source
COPY --from=build /app/dist ./dist
    
COPY backend/ ./
    
# Compile app
RUN deno task cache
    
CMD ["task", "run"]
    
    