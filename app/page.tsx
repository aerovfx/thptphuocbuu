import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Math LMS
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A comprehensive learning management system for mathematics education
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>For Students</CardTitle>
              <CardDescription>
                Access courses, track your progress, and learn mathematics at your own pace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/sign-up">
                <Button className="w-full">Get Started as Student</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Teachers</CardTitle>
              <CardDescription>
                Create and manage courses, track student progress, and build engaging content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/sign-up">
                <Button className="w-full" variant="outline">Become a Teacher</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Already have an account?</p>
          <Link href="/sign-in">
            <Button variant="ghost">Sign In</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
