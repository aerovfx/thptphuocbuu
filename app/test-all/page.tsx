import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function TestAllPage() {
  const tests = [];
  
  // Test 1: Basic page rendering
  tests.push({ name: "Page Rendering", status: "✅ Pass", message: "Page renders successfully" });
  
  // Test 2: Database connection
  try {
    const userCount = await db.user.count();
    tests.push({ name: "Database Connection", status: "✅ Pass", message: `Connected to database. Users: ${userCount}` });
  } catch (error) {
    tests.push({ name: "Database Connection", status: "❌ Fail", message: error instanceof Error ? error.message : "Unknown error" });
  }
  
  // Test 3: NextAuth.js
  try {
    const session = await getServerSession(authOptions);
    tests.push({ name: "NextAuth.js", status: "✅ Pass", message: session ? "Session system working" : "No session (expected)" });
  } catch (error) {
    tests.push({ name: "NextAuth.js", status: "❌ Fail", message: error instanceof Error ? error.message : "Unknown error" });
  }
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">System Test Results</h1>
      <div className="space-y-4">
        {tests.map((test, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{test.status}</span>
              <h2 className="text-xl font-semibold">{test.name}</h2>
            </div>
            <p className="text-gray-600 mt-2">{test.message}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Test URLs:</h3>
        <ul className="space-y-1">
          <li><a href="/test-simple" className="text-blue-600 hover:underline">/test-simple</a> - Basic page test</li>
          <li><a href="/test-db" className="text-blue-600 hover:underline">/test-db</a> - Database test</li>
          <li><a href="/test-nextauth" className="text-blue-600 hover:underline">/test-nextauth</a> - NextAuth.js test</li>
          <li><a href="/api/test" className="text-blue-600 hover:underline">/api/test</a> - API test</li>
          <li><a href="/api/test-db" className="text-blue-600 hover:underline">/api/test-db</a> - API database test</li>
          <li><a href="/api/test-auth" className="text-blue-600 hover:underline">/api/test-auth</a> - API NextAuth test</li>
        </ul>
      </div>
    </div>
  );
}
