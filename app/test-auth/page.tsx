"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestAuthPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <div>
              <p>Signed in as: {session.user?.email}</p>
              <p>Name: {session.user?.name}</p>
              <p>Role: {session.user?.role}</p>
              <Button onClick={() => signOut()} className="w-full">
                Sign out
              </Button>
            </div>
          ) : (
            <div>
              <p>Not signed in</p>
              <div className="space-y-2">
                <Button 
                  onClick={() => signIn("credentials", {
                    email: "teacher@example.com",
                    password: "teacher123"
                  })}
                  className="w-full"
                >
                  Sign in as Teacher
                </Button>
                <Button 
                  onClick={() => signIn("credentials", {
                    email: "student@example.com", 
                    password: "student123"
                  })}
                  className="w-full"
                  variant="outline"
                >
                  Sign in as Student
                </Button>
                <Button 
                  onClick={() => signIn("google")}
                  className="w-full"
                  variant="secondary"
                >
                  Sign in with Google
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
