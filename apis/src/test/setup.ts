import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from 'supertest';
import { app } from '../app'

let mongo : any;
declare global {
    function signin(): Promise<string[]>;
}

beforeAll(async() => {
    process.env.JWT_KEY = "YangZhou12138";
    process.env.BING_API_KEY = "d26a1aaaf30942ad9551e70ec8365ec3";

    mongo = await MongoMemoryServer.create()
    const mongoUri = mongo.getUri()

    await mongoose.connect(mongoUri, {});
})

beforeEach(async() => {
    // delete all the info in db
    const collections = await mongoose.connection.db.collections()

    for (let collection of collections) {
        await collection.deleteMany({});
    }
})

afterAll(async () => {
    // close the connection
    if (mongo) {
      await mongo.stop();
    }
    await mongoose.connection.close();
});

global.signin = async() => {
    const email = "test@illinois.edu";
    const password = "123456";

    const response = await request(app)
        .post("/api/users/signup")
        .send({
        email,
        password,
        })
        .expect(201);

    const cookie = response.get("Set-Cookie");

    return cookie;
}