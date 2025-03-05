import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { MUTATIONS } from "~/server/db/queries";

const f = createUploadthing();


// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
.middleware(async () => {
  try {
    // Attempt to authenticate the user
    const user = await auth();

    // Check if the user exists, otherwise throw an error
    if (!user?.userId) throw new UploadThingError("Unauthorized");

    // Return metadata if authentication is successful
    return { userId: user.userId };
  } catch (error) {
    console.error("Error in UploadThing middleware:", error);

    // Rethrow the error to prevent upload if authentication fails
    throw new UploadThingError(error instanceof Error ? error.message : "Unknown error occurred");
  }
})
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.ufsUrl);

      await MUTATIONS.createFile({
        file:{
            name: file.name,
            size: file.size,
            url: file.ufsUrl,
            parent: 0,
        },
        userId: metadata.userId,
      });

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
