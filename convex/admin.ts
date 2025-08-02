import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// Helper to check if user is admin
async function requireAdmin(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Invalid session.");
  }

  const user = await ctx.db.get(session.userId);
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return user;
}

export const getAllUsers = query({
  args: { 
    token: v.string(),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    let users = await ctx.db.query("users").collect();

    if (args.search && args.search.length >= 3) {
      const searchLower = args.search.toLowerCase();
      users = users.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower)
      );
    }

    return users.map(user => ({
      ...user,
      password: "***", // Hide password in admin view
    }));
  },
});

export const createUser = mutation({
  args: {
    token: v.string(),
    email: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    tempPassword: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists.");
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      password: args.tempPassword, // PLAINTEXT - FOR TESTING ONLY!
      name: "",
      role: args.role,
      active: false,
      isTempPassword: true,
    });

    return { userId };
  },
});

export const updateUser = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    await ctx.db.patch(args.userId, {
      email: args.email,
      name: args.name,
      role: args.role,
      active: args.active,
    });

    return { success: true };
  },
});

export const deleteUser = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    // Delete user sessions first
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    await ctx.db.delete(args.userId);

    return { success: true };
  },
});

export const resetPassword = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    newTempPassword: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    await ctx.db.patch(args.userId, {
      password: args.newTempPassword, // PLAINTEXT - FOR TESTING ONLY!
      isTempPassword: true,
    });

    // Delete user sessions to force re-login
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});
