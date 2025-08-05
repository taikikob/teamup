# specify the base image (my backend is a Node.js app)
FROM node:20

# specify the working directory inside the container
WORKDIR /app

# copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./
# install dependencies
RUN npm install

# Takes advantage of Docker layer caching by copying only package files first
# Only re runs npm install if package files change
# copy the rest of the application code to the working directory
COPY . .
# Build TypeScript
RUN npm run build

# Specify the port the image will expose
# This is the port your Node.js app will run on
# Port is published when the container is run
EXPOSE 3000

# Sets the default command a container using this image will run
CMD ["npm", "run", "start"]