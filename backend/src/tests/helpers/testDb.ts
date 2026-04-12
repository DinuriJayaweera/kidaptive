import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer;

// Call this in beforeAll() — starts a fake MongoDB
export async function connectTestDb() {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
}

// Call this in afterEach() — wipes all data between tests
export async function clearTestDb() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

// Call this in afterAll() — shuts down fake MongoDB
export async function disconnectTestDb() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
}