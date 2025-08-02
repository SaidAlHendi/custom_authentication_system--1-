import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper to get user from session
async function getUserFromSession(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  const user = await ctx.db.get(session.userId);
  return user;
}

// Helper to check if user can access object
async function canAccessObject(ctx: QueryCtx | MutationCtx, token: string, objectId: Id<"objects">) {
  const user = await getUserFromSession(ctx, token);
  if (!user) return { canAccess: false, user: null, object: null };

  const object = await ctx.db.get(objectId);
  if (!object) return { canAccess: false, user, object: null };

  // Admin can access all objects
  if (user.role === "admin") {
    return { canAccess: true, user, object };
  }

  // User can access if they created it or are assigned to it
  const canAccess = object.createdBy === user._id || 
    (object.assignedTo && object.assignedTo.includes(user._id));

  return { canAccess, user, object };
}

export const getObjects = query({
  args: { 
    token: v.string(),
    search: v.optional(v.string()),
    statusFilter: v.optional(v.string()),
    userFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("Invalid session");

    let objects;

    if (user.role === "admin") {
      // Admin sees all objects
      objects = await ctx.db.query("objects").collect();
    } else {
      // Users see only their objects or assigned objects
      const allObjects = await ctx.db.query("objects").collect();
      objects = allObjects.filter(obj => 
        obj.createdBy === user._id || 
        (obj.assignedTo && obj.assignedTo.includes(user._id))
      );
    }

    // Filter by status (admin only)
    if (args.statusFilter && user.role === "admin") {
      objects = objects.filter(obj => obj.status === args.statusFilter);
    }

    // Filter by user (admin only)
    if (args.userFilter && user.role === "admin") {
      objects = objects.filter(obj => obj.createdBy === args.userFilter);
    }

    // Search filter
    if (args.search && args.search.length >= 3) {
      const searchLower = args.search.toLowerCase();
      objects = objects.filter(obj => 
        obj.title.toLowerCase().includes(searchLower) ||
        obj.address.street.toLowerCase().includes(searchLower) ||
        obj.address.city.toLowerCase().includes(searchLower)
      );
    }

    // Hide deleted objects for non-admin users
    if (user.role !== "admin") {
      objects = objects.filter(obj => obj.status !== "gelöscht");
    }

    // Get creator names
    const objectsWithCreators = await Promise.all(
      objects.map(async (obj) => {
        const creator = await ctx.db.get(obj.createdBy);
        const assignedUsers = obj.assignedTo ? 
          await Promise.all(obj.assignedTo.map(id => ctx.db.get(id))) : [];
        
        return {
          ...obj,
          creatorName: creator?.name || "Unknown",
          assignedUsers: assignedUsers.filter(u => u !== null).map(u => ({ id: u!._id, name: u!.name })),
        };
      })
    );

    return objectsWithCreators;
  },
});

export const getObject = query({
  args: { token: v.string(), objectId: v.id("objects") },
  handler: async (ctx, args) => {
    const { canAccess, object } = await canAccessObject(ctx, args.token, args.objectId);
    
    if (!canAccess || !object) {
      throw new Error("Access denied or object not found");
    }

    // Get creator and assigned users info
    const creator = await ctx.db.get(object.createdBy);
    const assignedUsers = object.assignedTo ? 
      await Promise.all(object.assignedTo.map(id => ctx.db.get(id))) : [];

    return {
      ...object,
      creatorName: creator?.name || "Unknown",
      assignedUsers: assignedUsers.filter(u => u !== null).map(u => ({ id: u!._id, name: u!.name })),
    };
  },
});

export const createObject = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    address: v.object({
      street: v.string(),
      zipCode: v.string(),
      city: v.string(),
      additional: v.optional(v.string()),
    }),
    floor: v.optional(v.number()),
    room: v.optional(v.string()),
    assignedTo: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("Invalid session");

    const objectId = await ctx.db.insert("objects", {
      title: args.title,
      address: args.address,
      floor: args.floor,
      room: args.room,
      createdBy: user._id,
      assignedTo: args.assignedTo,
      status: "entwurf",
    });

    return { objectId };
  },
});

export const updateObject = mutation({
  args: {
    token: v.string(),
    objectId: v.id("objects"),
    title: v.optional(v.string()),
    address: v.optional(v.object({
      street: v.string(),
      zipCode: v.string(),
      city: v.string(),
      additional: v.optional(v.string()),
    })),
    floor: v.optional(v.number()),
    room: v.optional(v.string()),
    assignedTo: v.optional(v.array(v.id("users"))),
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
  },
  handler: async (ctx, args) => {
    const { canAccess, user, object } = await canAccessObject(ctx, args.token, args.objectId);
    
    if (!canAccess || !object || !user) {
      throw new Error("Access denied or object not found");
    }

    // Check if user can edit based on status
    if (object.status === "freigegeben" && user.role !== "admin") {
      throw new Error("Object is released and cannot be edited by users");
    }

    if (object.status === "in_überprüfung" && user.role !== "admin") {
      throw new Error("Object is under review and can only be edited by admin");
    }

    if (object.status === "abgeschlossen") {
      throw new Error("Object is completed and cannot be edited");
    }

    const updateData: any = {};
    
    if (args.title !== undefined) updateData.title = args.title;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.floor !== undefined) updateData.floor = args.floor;
    if (args.room !== undefined) updateData.room = args.room;
    if (args.assignedTo !== undefined) updateData.assignedTo = args.assignedTo;
    if (args.notes !== undefined) updateData.notes = args.notes;
    if (args.signature !== undefined) updateData.signature = args.signature;
    if (args.people !== undefined) updateData.people = args.people;
    if (args.keys !== undefined) updateData.keys = args.keys;
    if (args.rooms !== undefined) updateData.rooms = args.rooms;
    if (args.meters !== undefined) updateData.meters = args.meters;

    await ctx.db.patch(args.objectId, updateData);

    return { success: true };
  },
});

export const updateObjectStatus = mutation({
  args: {
    token: v.string(),
    objectId: v.id("objects"),
    status: v.union(
      v.literal("entwurf"),
      v.literal("freigegeben"),
      v.literal("in_überprüfung"),
      v.literal("zurückgewiesen"),
      v.literal("abgeschlossen"),
      v.literal("gelöscht")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("Invalid session");

    const object = await ctx.db.get(args.objectId);
    if (!object) throw new Error("Object not found");

    // Only admin can change status to certain states
    if (["in_überprüfung", "abgeschlossen", "gelöscht"].includes(args.status) && user.role !== "admin") {
      throw new Error("Only admin can set this status");
    }

    // Users can only release their own objects or assigned objects
    if (args.status === "freigegeben" && user.role !== "admin") {
      const canAccess = object.createdBy === user._id || 
        (object.assignedTo && object.assignedTo.includes(user._id));
      if (!canAccess) {
        throw new Error("Access denied");
      }
    }

    await ctx.db.patch(args.objectId, { status: args.status });

    return { success: true };
  },
});

export const deleteObject = mutation({
  args: {
    token: v.string(),
    objectId: v.id("objects"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("Invalid session");

    const object = await ctx.db.get(args.objectId);
    if (!object) throw new Error("Object not found");

    // Only admin or creator can delete (soft delete by setting status)
    if (user.role !== "admin" && object.createdBy !== user._id) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(args.objectId, { status: "gelöscht" });

    return { success: true };
  },
});

export const getAllUsers = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("Invalid session");

    const users = await ctx.db.query("users").collect();
    return users.filter(u => u.active).map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
    }));
  },
});

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("Invalid session");

    return await ctx.storage.generateUploadUrl();
  },
});
