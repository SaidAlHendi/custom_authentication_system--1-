import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper to get user from session
async function getUserFromSession(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  const user = await ctx.db.get(session.userId);
  return user;
}

// Generate upload URL for object images
export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("Invalid session");

    return await ctx.storage.generateUploadUrl();
  },
});

// Add image to object section
export const addObjectImage = mutation({
  args: {
    token: v.string(),
    objectId: v.id("objects"),
    section: v.union(v.literal("keys"), v.literal("rooms"), v.literal("meters")),
    sectionIndex: v.optional(v.number()),
    storageId: v.id("_storage"),
    filename: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("Invalid session");

    const object = await ctx.db.get(args.objectId);
    if (!object) throw new Error("Object not found");

    // Check if user can access object
    const canAccess = object.createdBy === user._id || 
      (object.assignedTo && object.assignedTo.includes(user._id)) ||
      user.role === "admin";

    if (!canAccess) throw new Error("Not authorized");

    // Check if object can be edited
    if (object.status === "abgeschlossen") {
      throw new Error("Cannot edit completed object");
    }

    if (object.status === "freigegeben" && user.role !== "admin") {
      throw new Error("Cannot edit released object");
    }

    if (object.status === "in_überprüfung" && user.role !== "admin") {
      throw new Error("Cannot edit object under review");
    }

    await ctx.db.insert("objectImages", {
      objectId: args.objectId,
      section: args.section,
      sectionIndex: args.sectionIndex,
      storageId: args.storageId,
      filename: args.filename,
      createdAt: Date.now(),
    });

    return null;
  },
});

// Delete object image
export const deleteObjectImage = mutation({
  args: {
    token: v.string(),
    imageId: v.id("objectImages"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("Invalid session");

    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image not found");

    const object = await ctx.db.get(image.objectId);
    if (!object) throw new Error("Object not found");

    // Check if user can access object
    const canAccess = object.createdBy === user._id || 
      (object.assignedTo && object.assignedTo.includes(user._id)) ||
      user.role === "admin";

    if (!canAccess) throw new Error("Not authorized");

    // Check if object can be edited
    if (object.status === "abgeschlossen") {
      throw new Error("Cannot edit completed object");
    }

    if (object.status === "freigegeben" && user.role !== "admin") {
      throw new Error("Cannot edit released object");
    }

    if (object.status === "in_überprüfung" && user.role !== "admin") {
      throw new Error("Cannot edit object under review");
    }

    await ctx.storage.delete(image.storageId);
    await ctx.db.delete(args.imageId);

    return null;
  },
});

// Get images for object section
export const getObjectImages = query({
  args: {
    token: v.string(),
    objectId: v.id("objects"),
    section: v.union(v.literal("keys"), v.literal("rooms"), v.literal("meters")),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("Invalid session");

    const object = await ctx.db.get(args.objectId);
    if (!object) throw new Error("Object not found");

    // Check if user can access object
    const canAccess = object.createdBy === user._id || 
      (object.assignedTo && object.assignedTo.includes(user._id)) ||
      user.role === "admin";

    if (!canAccess) throw new Error("Not authorized");

    const images = await ctx.db
      .query("objectImages")
      .withIndex("by_object_and_section", (q: any) => 
        q.eq("objectId", args.objectId).eq("section", args.section)
      )
      .collect();

    // Get URLs for all images
    const imagesWithUrls = await Promise.all(
      images.map(async (image) => {
        const url = await ctx.storage.getUrl(image.storageId);
        return {
          _id: image._id,
          filename: image.filename,
          url: url,
        };
      })
    );

    return imagesWithUrls;
  },
});

// Get images for specific object section index
export const getObjectImagesByIndex = query({
  args: {
    token: v.string(),
    objectId: v.id("objects"),
    section: v.union(v.literal("keys"), v.literal("rooms"), v.literal("meters")),
    sectionIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("Invalid session");

    const object = await ctx.db.get(args.objectId);
    if (!object) throw new Error("Object not found");

    // Check if user can access object
    const canAccess = object.createdBy === user._id || 
      (object.assignedTo && object.assignedTo.includes(user._id)) ||
      user.role === "admin";

    if (!canAccess) throw new Error("Not authorized");

    let query = ctx.db
      .query("objectImages")
      .withIndex("by_object_and_section", (q: any) => 
        q.eq("objectId", args.objectId).eq("section", args.section)
      );

    // If sectionIndex is provided, filter by it
    if (args.sectionIndex !== undefined) {
      const allImages = await query.collect();
      
      const filteredImages = allImages.filter(img => img.sectionIndex === args.sectionIndex);
      
      // Get URLs for filtered images
      const imagesWithUrls = await Promise.all(
        filteredImages.map(async (image) => {
          const url = await ctx.storage.getUrl(image.storageId);
          return {
            _id: image._id,
            filename: image.filename,
            url: url,
          };
        })
      );

      return imagesWithUrls;
    } else {
      // Get all images for section (for backward compatibility)
      const images = await query.collect();
      
      // Get URLs for all images
      const imagesWithUrls = await Promise.all(
        images.map(async (image) => {
          const url = await ctx.storage.getUrl(image.storageId);
          return {
            _id: image._id,
            filename: image.filename,
            url: url,
          };
        })
      );

      return imagesWithUrls;
    }
  },
});

// Get all images for an object (for PDF export)
export const getAllObjectImages = query({
  args: {
    token: v.string(),
    objectId: v.id("objects"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("Invalid session");

    const object = await ctx.db.get(args.objectId);
    if (!object) throw new Error("Object not found");

    // Check if user can access object
    const canAccess = object.createdBy === user._id || 
      (object.assignedTo && object.assignedTo.includes(user._id)) ||
      user.role === "admin";

    if (!canAccess) throw new Error("Not authorized");

    const allImages = await ctx.db
      .query("objectImages")
      .withIndex("by_object_and_section", (q: any) => 
        q.eq("objectId", args.objectId)
      )
      .collect();

    // Group images by section
    const imagesBySection: { [section: string]: any[] } = {
      keys: [],
      rooms: [],
      meters: []
    };

    // Get URLs for all images and group them
    for (const image of allImages) {
      const url = await ctx.storage.getUrl(image.storageId);
      const imageWithUrl = {
        _id: image._id,
        filename: image.filename,
        url: url,
        section: image.section,
        sectionIndex: image.sectionIndex,
      };
      
      if (image.section in imagesBySection) {
        imagesBySection[image.section].push(imageWithUrl);
      }
    }

    return imagesBySection;
  },
});

// Generate PDF with all images
export const generatePDFWithImages = mutation({
  args: {
    token: v.string(),
    objectId: v.id("objects"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("Invalid session");

    const object = await ctx.db.get(args.objectId);
    if (!object) throw new Error("Object not found");

    // Check if user can access object
    const canAccess = object.createdBy === user._id || 
      (object.assignedTo && object.assignedTo.includes(user._id)) ||
      user.role === "admin";

    if (!canAccess) throw new Error("Not authorized");

    const allImages = await ctx.db
      .query("objectImages")
      .withIndex("by_object_and_section", (q: any) => 
        q.eq("objectId", args.objectId)
      )
      .collect();

    // Group images by section
    const imagesBySection: { [section: string]: any[] } = {
      keys: [],
      rooms: [],
      meters: []
    };

    // Get URLs for all images and group them
    for (const image of allImages) {
      const url = await ctx.storage.getUrl(image.storageId);
      const imageWithUrl = {
        _id: image._id,
        filename: image.filename,
        url: url,
        section: image.section,
        sectionIndex: image.sectionIndex,
      };
      
      if (image.section in imagesBySection) {
        imagesBySection[image.section].push(imageWithUrl);
      }
    }

    return imagesBySection;
  },
});