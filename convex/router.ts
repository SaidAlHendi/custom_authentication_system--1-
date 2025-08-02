import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { v } from "convex/values";

const http = httpRouter();

// Route to serve storage files
http.route({
  path: "/api/storage/:storageId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const storageId = url.pathname.split("/").pop();
    
    if (!storageId) {
      return new Response("Storage ID required", { status: 400 });
    }

    try {
      const file = await ctx.storage.get(storageId);
      if (!file) {
        return new Response("File not found", { status: 404 });
      }

      // Try to determine content type from file extension or use default
      const contentType = "image/jpeg"; // Default for most uploaded images

      return new Response(file, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        },
      });
    } catch (error) {
      console.error("Error serving file:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

export default http;
