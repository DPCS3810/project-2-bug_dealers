# Use an official Node runtime as a parent image
FROM node:20-alpine 

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5173

# Start the application with --host to expose it
CMD ["npm", "run", "dev", "--", "--host"]
