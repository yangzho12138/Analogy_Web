FROM node:alpine
ENV JWT_KEY=TIMANLABPROJECT2023FALLUIUC
ENV MONGO_URI=mongodb+srv://yz96:o4lSlSFeZMkZMHFk@cluster0.roolo5s.mongodb.net/TIMAN?retryWrites=true&w=majority&appName=AtlasApp
ENV PORT=6000
ENV BING_API_KEY=d26a1aaaf30942ad9551e70ec8365ec3
ENV NODE_ENV=test
WORKDIR /usr/src/app 
COPY package*.json ./ 
RUN npm install
COPY . . 
EXPOSE 6000
CMD [ "npm", "start" ]