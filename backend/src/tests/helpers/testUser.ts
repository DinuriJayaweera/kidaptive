import User from "../../models/User.js";

// The User model's pre-save hook hashes passwords automatically.
// So we pass plain text here — DO NOT hash manually.

export async function createVerifiedParent(overrides = {}) {
    return User.create({
        name: "Test Parent",
        email: "parent@test.com",
        password: "Password123!",   // plain text — model hashes it
        role: "parent",
        authProvider: "local",
        emailVerified: true,
        tokenVersion: 0,
        ...overrides,
    });
}

export async function createUnverifiedParent(overrides = {}) {
    return User.create({
        name: "Unverified Parent",
        email: "unverified@test.com",
        password: "Password123!",   // plain text — model hashes it
        role: "parent",
        authProvider: "local",
        emailVerified: false,
        tokenVersion: 0,
        ...overrides,
    });
}

export async function createAdmin(overrides = {}) {
    return User.create({
        name: "Test Admin",
        email: "admin@test.com",
        password: "Admin123!",      // plain text — model hashes it
        role: "admin",
        authProvider: "local",
        emailVerified: true,
        tokenVersion: 0,
        ...overrides,
    });
}

export async function createChild(parentId: string, overrides = {}) {
    return User.create({
        name: "Test Child",
        email: "testchild@child.kidaptive.local",
        username: "testchild",
        password: "dummy",
        age: 7,
        role: "child",
        parentId,
        loginMethod: "pin",
        pin: "1234",                // plain text — model hashes it
        emailVerified: true,
        tokenVersion: 0,
        ...overrides,
    });
}