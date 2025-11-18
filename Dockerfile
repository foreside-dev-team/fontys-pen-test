# Stage 1: Build the NestJS application
FROM node:20 as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy the entire project (including libs) before installing dependencies
COPY . .

RUN npm config set strict-ssl false 

# Install dependencies (this will trigger the postinstall script)
RUN npm install

# Build the NestJS application (this will trigger the postbuild script)
RUN npm run build

# Stage 2: Create a lightweight production image
FROM node:20 as production

WORKDIR /app

# Copy the built application and node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/libs ./libs
COPY --from=build /app/package*.json ./

# Expose the application port (if your NestJS app runs on 3000)
EXPOSE 3001

# Start the application using npm run start:prod
CMD ["npm", "run", "start:prod"]