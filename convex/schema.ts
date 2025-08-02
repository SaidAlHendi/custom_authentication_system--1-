import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  users: defineTable({
    email: v.string(),
    password: v.string(), // PLAINTEXT - FOR TESTING ONLY!
    name: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    active: v.boolean(),
    isTempPassword: v.boolean(),
  })
    .index("by_email", ["email"])
    .index("by_active", ["active"]),
  
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  objects: defineTable({
    title: v.string(),
    address: v.object({
      street: v.string(),
      zipCode: v.string(),
      city: v.string(),
      additional: v.optional(v.string()),
    }),
    floor: v.optional(v.number()),
    room: v.optional(v.string()),
    createdBy: v.id("users"),
    assignedTo: v.optional(v.array(v.id("users"))),
    status: v.union(
      v.literal("entwurf"),
      v.literal("freigegeben"),
      v.literal("in_überprüfung"),
      v.literal("zurückgewiesen"),
      v.literal("abgeschlossen"),
      v.literal("gelöscht")
    ),
    notes: v.optional(v.string()),
    signature: v.optional(v.string()),
    people: v.optional(v.array(v.object({
      name: v.string(),
      function: v.string(),
      address: v.optional(v.string()),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
    }))),
    keys: v.optional(v.array(v.object({
      type: v.string(),
      count: v.number(),
      images: v.optional(v.array(v.id("_storage"))),
    }))),
    rooms: v.optional(v.array(v.object({
      name: v.string(),
      equipment: v.optional(v.string()),
      condition: v.optional(v.string()),
      images: v.optional(v.array(v.id("_storage"))),
    }))),
    meters: v.optional(v.array(v.object({
      type: v.string(),
      number: v.string(),
      reading: v.string(),
      images: v.optional(v.array(v.id("_storage"))),
    }))),
  })
    .index("by_created_by", ["createdBy"])
    .index("by_status", ["status"])
    .index("by_assigned", ["assignedTo"]),

  objectImages: defineTable({
    objectId: v.id("objects"),
    section: v.union(
      v.literal("keys"),
      v.literal("rooms"), 
      v.literal("meters")
    ),
    storageId: v.id("_storage"),
    filename: v.string(),
    createdAt: v.number(),
  })
    .index("by_object_and_section", ["objectId", "section"])
    .index("by_storage", ["storageId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
