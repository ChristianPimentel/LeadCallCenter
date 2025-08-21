# Use a Node.js base image
FROM node:latest as builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Update dependencies to address warnings
RUN npm update


# Copy the rest of the application files
COPY . .

# Build the Next.js application
RUN npm run build

FROM node:latest

# Set the working directory
WORKDIR /app

# Expose port 3000
EXPOSE 3000

# Copy the build output from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Start the production server
CMD [ "npm", "start" ]