import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from 'supertest';
import { app } from '../app'
import { Concept } from "../models/concept";

let mongo : any;
declare global {
    function signin(): Promise<string[]>;
    function selectConcept(cookie: string[]): Promise<string>;
    function unselectConcept(cookie: string[], conceptId: string): any;
    function setTestcase(cookie: string[]): any;
}

beforeAll(async() => {
    process.env.JWT_KEY = "YangZhou12138";
    process.env.BING_API_KEY = "d26a1aaaf30942ad9551e70ec8365ec3";

    // transactions support - replica set
    mongo = await MongoMemoryReplSet.create({
        replSet: { count: 4 }
    })
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
    const email = "test123@illinois.edu";
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

global.selectConcept = async(cookie) => {
    // const cookie = await global.signin();
    // add concept
    await request(app)
        .post("/api/concept/add")
        .set('Cookie', cookie)
        .send({
            "concepts": [
                "Data Structure"
            ]
        })
        .expect(201);
    // get all concepts
    const response2 = await request(app)
        .get("/api/concept/getAll")
        .set('Cookie', cookie)
        .expect(200)
    // console.log("response2", response2.body)
    const conceptId = response2.body[0].id
    // console.log("conceptId", conceptId)
    // select the concept
    await request(app)
        .post("/api/concept/select")
        .set('Cookie', cookie)
        .send({
            "concept": conceptId
        })
        .expect(200)

    return conceptId;
}

global.unselectConcept = async(cookie, conceptId) => {
    await request(app)
        .post("/api/concept/unselect")
        .set('Cookie', cookie)
        .send({
            "concept": conceptId
        })
        .expect(200)
}

global.setTestcase = async(cookie) => {
    // insert testcases without clear label
    await request(app)
    .post("/api/search/insertTestCases")
    .set('Cookie', cookie)
    .send({
        filePath: __dirname + "/testcase_without_label.jsonl",
        type: "1"
    })
    .expect(200)

    // insert testcases with clear label
    await request(app)
    .post("/api/search/insertTestCases")
    .set('Cookie', cookie)
    .send({
        filePath: __dirname + "/testcase_with_label.jsonl",
        type: "2"
    })
    .expect(200)
}