import { db } from "@/lib/db";

export default async function TestDbPage() {
  try {
    const userCount = await db.user.count();
    const categoryCount = await db.category.count();
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Database Test Page</h1>
        <p>Database connection successful!</p>
        <p>Users: {userCount}</p>
        <p>Categories: {categoryCount}</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Database Test Page</h1>
        <p className="text-red-600">Database connection failed!</p>
        <p className="text-red-600">Error: {error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    );
  }
}
