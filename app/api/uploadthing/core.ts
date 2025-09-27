import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";

import { isTeacher } from "@/lib/teacher";
 
const f = createUploadthing();
 
const handleAuth = async () => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const isAuthorized = isTeacher(session?.user?.role);

  if (!userId || !isAuthorized) throw new Error("Unauthorized");
  return { userId };
}

// Temporary mock router for development
export const ourFileRouter = {
  courseImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => await handleAuth())
    .onUploadComplete(({ file }) => {
      console.log("Course image uploaded:", file);
      return { uploadedBy: "mock-user" };
    }),
  courseAttachment: f(["text", "image", "video", "audio", "pdf"])
    .middleware(async () => await handleAuth())
    .onUploadComplete(({ file }) => {
      console.log("Course attachment uploaded:", file);
      return { uploadedBy: "mock-user" };
    }),
  chapterVideo: f({ video: { maxFileCount: 1, maxFileSize: "512GB" } })
    .middleware(async () => await handleAuth())
    .onUploadComplete(({ file }) => {
      console.log("Chapter video uploaded:", file);
      return { uploadedBy: "mock-user" };
    })
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;