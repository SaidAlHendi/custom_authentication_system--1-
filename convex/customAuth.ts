import { query, mutation, QueryCtx, MutationCtx } from './_generated/server'
import { v } from 'convex/values'
import { Id } from './_generated/dataModel'

// Generate a random token
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Helper to get user from session
async function getUserFromSession(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query('sessions')
    .withIndex('by_token', (q) => q.eq('token', token))
    .first()

  if (!session || session.expiresAt < Date.now()) {
    return null
  }

  const user = await ctx.db.get(session.userId)
  return user
}

export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token)

    if (!user) {
      return null
    }

    return {
      user,
      needsPasswordChange: user.isTempPassword,
    }
  },
})

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first()

    if (!user) {
      throw new Error('Invalid email or password.')
    }

    // Check if user is active
    if (!user.active) {
      throw new Error('Account is not active. Please contact an administrator.')
    }

    // Compare password (PLAINTEXT - FOR TESTING ONLY!)
    if (user.password !== args.password) {
      throw new Error('Invalid email or password.')
    }

    // Create session
    const token = generateToken()
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days

    await ctx.db.insert('sessions', {
      userId: user._id,
      token,
      expiresAt,
    })

    return {
      token,
      user,
      needsPasswordChange: user.isTempPassword,
    }
  },
})

export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user exists with email, active: false, isTempPassword: true
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first()

    if (!existingUser) {
      throw new Error(
        'Registration not allowed. Contact an administrator to create your account first.'
      )
    }

    if (existingUser.active || !existingUser.isTempPassword) {
      throw new Error('Account already exists or registration not allowed.')
    }

    // Update user with new password and activate account
    await ctx.db.patch(existingUser._id, {
      password: args.password, // PLAINTEXT - FOR TESTING ONLY!
      name: args.name,
      active: true,
      isTempPassword: false,
    })

    // Get updated user
    const updatedUser = await ctx.db.get(existingUser._id)
    if (!updatedUser) {
      throw new Error('Failed to create account.')
    }

    // Create session
    const token = generateToken()
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days

    await ctx.db.insert('sessions', {
      userId: updatedUser._id,
      token,
      expiresAt,
    })

    return {
      token,
      user: updatedUser,
    }
  },
})

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first()

    if (session) {
      await ctx.db.delete(session._id)
    }

    return { success: true }
  },
})

export const updateProfile = mutation({
  args: {
    token: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token)

    if (!user) {
      throw new Error('Invalid session.')
    }

    await ctx.db.patch(user._id, {
      name: args.name,
    })

    return { success: true }
  },
})

export const changePassword = mutation({
  args: {
    token: v.string(),
    oldPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token)

    if (!user) {
      throw new Error('Invalid session.')
    }

    // Verify old password (PLAINTEXT - FOR TESTING ONLY!)
    if (user.password !== args.oldPassword) {
      throw new Error('Current password is incorrect.')
    }

    // Update password
    await ctx.db.patch(user._id, {
      password: args.newPassword, // PLAINTEXT - FOR TESTING ONLY!
      isTempPassword: false,
    })

    return { success: true }
  },
})

// convex/functions/users.ts
export const loggedInUser = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token)

    return user ?? null
  },
})
