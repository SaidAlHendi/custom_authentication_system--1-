import { mutation } from "./_generated/server";
import { v } from "convex/values";

// This mutation creates a default admin user for testing
export const createDefaultAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@test.com"))
      .first();

    if (existingAdmin) {
      return { message: "Admin user already exists" };
    }

    // Create default admin user
    const adminId = await ctx.db.insert("users", {
      email: "admin@test.com",
      password: "admin123", // PLAINTEXT - FOR TESTING ONLY!
      name: "System Administrator",
      role: "admin",
      active: true,
      isTempPassword: false,
    });

    // Create a test user with temporary password
    const testUserId = await ctx.db.insert("users", {
      email: "user@test.com",
      password: "temp123", // PLAINTEXT - FOR TESTING ONLY!
      name: "",
      role: "user",
      active: false,
      isTempPassword: true,
    });

    return { 
      message: "Default users created successfully",
      adminId,
      testUserId,
      credentials: {
        admin: { email: "admin@test.com", password: "admin123" },
        testUser: { email: "user@test.com", password: "temp123" }
      }
    };
  },
});

export const createSampleObject = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@test.com"))
      .first();
    
    const testUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "user@test.com"))
      .first();

    if (!admin || !testUser) {
      throw new Error("Default users not found");
    }

    const sampleObjectId = await ctx.db.insert("objects", {
      title: "Musterwohnung Hauptstraße 123",
      address: {
        street: "Hauptstraße 123",
        zipCode: "12345",
        city: "Musterstadt",
        additional: "2. OG links",
      },
      floor: 2,
      room: "Wohnung 4",
      createdBy: admin._id,
      assignedTo: [testUser._id],
      status: "entwurf",
      notes: "Beispielobjekt für Testzwecke",
    });

    return { message: "Sample object created", sampleObjectId };
  },
});
