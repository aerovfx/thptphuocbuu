import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function TestNextAuthPage() {
  try {
    const session = await getServerSession(authOptions);
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">NextAuth.js Test Page</h1>
        <p>NextAuth.js is working!</p>
        {session ? (
          <div>
            <p>User: {session.user?.name}</p>
            <p>Email: {session.user?.email}</p>
            <p>Role: {session.user?.role}</p>
          </div>
        ) : (
          <p>No session found</p>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">NextAuth.js Test Page</h1>
        <p className="text-red-600">NextAuth.js failed!</p>
        <p className="text-red-600">Error: {error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    );
  }
}
