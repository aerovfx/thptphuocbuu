import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { logger } from './logger'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('[Auth] authorize called')
        logger.debug('[Auth] authorize called with:', {
          email: credentials?.email ? `${credentials.email.substring(0, 3)}***` : 'missing',
          hasPassword: !!credentials?.password,
        })

        if (!credentials?.email || !credentials?.password) {
          console.error('[Auth] Missing credentials')
          logger.error('[Auth] Missing credentials')
          return null
        }

        try {
          // Normalize email (trim and lowercase)
          const normalizedEmail = credentials.email.trim().toLowerCase()
          // Trim password to ensure consistency with registration and login flows
          const normalizedPassword = credentials.password.trim()
          console.log(`[Auth] Normalized email: ${normalizedEmail}`)
          logger.debug(`[Auth] Normalized email: ${normalizedEmail}`)

          // Force reconnect to ensure fresh connection
          await prisma.$connect()

          // Find user with normalized email
          console.log(`[Auth] Searching for user: ${normalizedEmail}`)
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
          })

          if (!user) {
            console.error(`[Auth] User not found: ${normalizedEmail}`)
            logger.error(`[Auth] User not found: ${normalizedEmail}`)
            
            // Debug: List all users to see what's in DB and check for exact match (dev only)
            if (process.env.NODE_ENV === 'development') {
              const allUsers = await prisma.user.findMany({
                select: { email: true, firstName: true, lastName: true },
              })
              logger.debug(`[Auth] Debug: Found ${allUsers.length} total users in DB`)
              logger.debug(`[Auth] Debug: Searching for normalized: "${normalizedEmail}"`)
              
              // Check if email exists with different case
              const matchingUser = allUsers.find(u => u.email.toLowerCase() === normalizedEmail)
              if (matchingUser) {
                logger.debug(`[Auth] Debug: Found user with different case: "${matchingUser.email}"`)
                // Try to find again with the exact email from DB
                const userWithExactEmail = await prisma.user.findUnique({
                  where: { email: matchingUser.email }
                })
                if (userWithExactEmail && userWithExactEmail.password) {
                  logger.debug(`[Auth] Found user using exact email from DB: ${userWithExactEmail.email}`)
                  // Continue with this user
                  const isPasswordValid = await bcrypt.compare(
                    normalizedPassword,
                    userWithExactEmail.password
                  )
                  if (isPasswordValid) {
                    logger.debug(`[Auth] Password valid for user: ${userWithExactEmail.email}`)
                    return {
                      id: userWithExactEmail.id,
                      email: userWithExactEmail.email,
                      name: `${userWithExactEmail.firstName} ${userWithExactEmail.lastName}`,
                      role: userWithExactEmail.role,
                      image: userWithExactEmail.avatar
                    }
                  } else {
                    logger.error(`[Auth] Invalid password for user: ${userWithExactEmail.email}`)
                  }
                }
              } else {
                logger.error(`[Auth] No matching user found even with case-insensitive search`)
              }
            }
            
            return null
          }

          console.log(`[Auth] User found: ${user.firstName} ${user.lastName}, Role: ${user.role}`)
          logger.debug(`[Auth] User found: ${user.firstName} ${user.lastName}, Role: ${user.role}`)

          // Check if user has password (not OAuth-only user)
          if (!user.password) {
            console.error(`[Auth] User has no password: ${normalizedEmail}`)
            logger.error(`[Auth] User has no password: ${normalizedEmail}`)
            return null
          }

          console.log(`[Auth] Comparing password...`)
          logger.debug(`[Auth] Comparing password...`)
          const isPasswordValid = await bcrypt.compare(
            normalizedPassword,
            user.password
          )

          console.log(`[Auth] Password valid: ${isPasswordValid}`)
          logger.debug(`[Auth] Password valid: ${isPasswordValid}`)

          if (!isPasswordValid) {
            console.error(`[Auth] Invalid password for: ${normalizedEmail}`)
            logger.error(`[Auth] Invalid password for: ${normalizedEmail}`)
            // Return null to trigger CredentialsSignin error
            return null
          }

          console.log(`[Auth] Login successful: ${normalizedEmail}`)
          logger.debug(`[Auth] Login successful: ${normalizedEmail}`)

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            image: user.avatar
          }
        } catch (error: any) {
          console.error('[Auth] Login error:', error)
          console.error('[Auth] Error stack:', error?.stack)
          logger.error('[Auth] Login error:', error)
          // Return null to trigger CredentialsSignin error
          // This ensures consistent error handling
          return null
        } finally {
          // Ensure Prisma connection is properly managed
          // Don't disconnect here as it's a singleton
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If url is a relative URL, make it absolute
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // If url is on the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url
      }
      // Default redirect to dashboard
      return `${baseUrl}/dashboard`
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign in
      if (account?.provider === 'google') {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (existingUser) {
            // Update avatar from OAuth if user doesn't have one or if OAuth avatar is newer
            if (user.image && (!existingUser.avatar || user.image !== existingUser.avatar)) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { avatar: user.image },
              })
            }
            
            // Update OAuth account if needed
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              update: {
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
              create: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            })
            return true
          } else {
            // Create new user from OAuth
            const nameParts = user.name?.split(' ') || ['User', '']
            const firstName = nameParts[0]
            const lastName = nameParts.slice(1).join(' ') || 'User'

            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                firstName,
                lastName,
                avatar: user.image,
                emailVerified: new Date(),
                role: 'STUDENT', // Default role for OAuth users
              },
            })

            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            })
            return true
          }
        } catch (error) {
          logger.error('OAuth sign in error:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.role = user.role
        token.id = user.id
        token.email = user.email || undefined
        // Map avatar from user object (could be from credentials or OAuth)
        token.avatar = (user as any).avatar || (user as any).image || null
      }

      // Always fetch latest avatar from database to ensure sync
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              role: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          })

          if (dbUser) {
            token.role = dbUser.role
            token.avatar = dbUser.avatar
          }
        } catch (error) {
          // Log error but don't throw - allow token to proceed with existing data
          logger.error('[Auth] Error fetching user data in jwt callback:', error)
        }
      }

      // Refresh user data if needed
      if (trigger === 'update') {
        try {
          const updatedUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              role: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          })

          if (updatedUser) {
            token.role = updatedUser.role
            token.avatar = updatedUser.avatar
          }
        } catch (error) {
          // Log error but don't throw - allow token to proceed with existing data
          logger.error('[Auth] Error updating user data in jwt callback:', error)
        }
      }

      // Check token expiration
      const now = Math.floor(Date.now() / 1000)
      if (token.exp && typeof token.exp === 'number' && token.exp < now) {
        throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.')
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.email = token.email as string
        // Sync avatar from database to session
        session.user.image = (token.avatar as string) || null
      }

      // Validate session
      if (!token.id || !token.role) {
        throw new Error('Session không hợp lệ')
      }

      return session
    },
  },
  events: {
    async signOut({ token }) {
      // Clean up on sign out if needed
      if (token?.id) {
        // Could invalidate tokens here if using database sessions
      }
    },
  },
  debug: false, // Set to true only when debugging auth issues (disabled to reduce warnings)
}

