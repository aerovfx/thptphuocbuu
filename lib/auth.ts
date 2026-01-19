import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { logger } from './logger'
import { sendAccountLockoutEmail } from './email'

const isGoogleOAuthConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET

console.log('[Auth Config] Env check:')
console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
console.log('- NEXTAUTH_URL_INTERNAL:', process.env.NEXTAUTH_URL_INTERNAL)
console.log('- NODE_ENV:', process.env.NODE_ENV)
console.log('- VERCEL_URL:', process.env.VERCEL_URL)
console.log('- HOSTNAME:', process.env.HOSTNAME)
console.log('- PORT:', process.env.PORT)

// Throttle DB reads inside auth callbacks to avoid slowing down every request.
// NextAuth calls `jwt()` frequently (e.g. session checks). A full DB roundtrip each time
// will make the whole app feel sluggish under load.
const USER_REFRESH_MIN_INTERVAL_SECONDS = 10 * 60 // 10 minutes

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

          // Block login for SUSPENDED users
          if (user.status && user.status !== 'ACTIVE') {
            logger.warn(`[Auth] Login blocked for suspended user: ${normalizedEmail} (status=${user.status})`)
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

          // Check account lockout
          const now = new Date()
          if (user.lockedUntil && user.lockedUntil > now) {
            const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000)
            console.error(`[Auth] Account locked until: ${user.lockedUntil}, ${minutesRemaining} minutes remaining`)
            logger.error(`[Auth] Account locked until: ${user.lockedUntil}, ${minutesRemaining} minutes remaining`)
            // Return null to trigger CredentialsSignin error
            // Error message will be handled in login page
            return null
          }

          // If lockout expired, reset failed attempts
          if (user.lockedUntil && user.lockedUntil <= now) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
              },
            })
            logger.debug(`[Auth] Account lockout expired, resetting failed attempts for: ${normalizedEmail}`)
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

            // Increment failed login attempts
            const newFailedAttempts = (user.failedLoginAttempts || 0) + 1
            const MAX_FAILED_ATTEMPTS = 5
            const LOCKOUT_DURATION_MINUTES = 15

            if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
              // Lock account for 15 minutes
              const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  failedLoginAttempts: newFailedAttempts,
                  lockedUntil: lockedUntil,
                },
              })
              logger.error(`[Auth] Account locked due to ${newFailedAttempts} failed attempts: ${normalizedEmail}`)
              // Send email notification about account lockout
              try {
                await sendAccountLockoutEmail(normalizedEmail, lockedUntil)
              } catch (emailError) {
                logger.error(`[Auth] Failed to send lockout email: ${emailError}`)
              }
            } else {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  failedLoginAttempts: newFailedAttempts,
                },
              })
              logger.warn(`[Auth] Failed login attempt ${newFailedAttempts}/${MAX_FAILED_ATTEMPTS} for: ${normalizedEmail}`)
            }

            // Return null to trigger CredentialsSignin error
            return null
          }

          // Login successful - reset failed attempts
          if (user.failedLoginAttempts > 0 || user.lockedUntil) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
              },
            })
            logger.debug(`[Auth] Reset failed login attempts for successful login: ${normalizedEmail}`)
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
    ...(isGoogleOAuthConfigured
      ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          authorization: {
            params: {
              prompt: 'consent',
              access_type: 'offline',
              response_type: 'code',
            },
          },
        }),
      ]
      : (() => {
        // Avoid noisy logs in tests; in prod this helps diagnose missing env.
        if (process.env.NODE_ENV !== 'test') {
          logger.warn(
            '[Auth] Google OAuth is disabled (missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET).'
          )
        }
        return []
      })()),
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
          // Email domain whitelist for OAuth registration
          const ALLOWED_EMAIL_DOMAINS = [
            'thptphuocbuu.edu.vn', // Organization domain
            'gmail.com', // Allow Gmail for testing/external users (can remove in strict production)
          ]

          const emailDomain = user.email!.split('@')[1]

          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (existingUser) {
            // Block OAuth sign-in for SUSPENDED users
            if (existingUser.status && existingUser.status !== 'ACTIVE') {
              logger.warn(`[Auth] OAuth sign-in blocked for suspended user: ${existingUser.email} (status=${existingUser.status})`)
              return false
            }

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
            // NEW USER REGISTRATION - Check email domain whitelist
            if (!ALLOWED_EMAIL_DOMAINS.includes(emailDomain)) {
              logger.warn(`[Auth] OAuth registration blocked for unauthorized domain: ${emailDomain} (email: ${user.email})`)
              return false // Block registration from unauthorized domains
            }

            logger.info(`[Auth] Creating new OAuth user from authorized domain: ${emailDomain}`)

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
      // Initial sign in - handle both credentials and OAuth
      if (user) {
        token.role = user.role || 'STUDENT'
        // If it's NOT google (e.g. credentials), use the user.id directly
        // If it IS google, we shouldn't trust user.id as it might be the provider ID
        if (account?.provider !== 'google') {
          token.id = user.id
        }
        token.email = user.email || undefined
        // Map avatar from user object (could be from credentials or OAuth)
        token.avatar = (user as any).avatar || (user as any).image || null
      }

      // If OAuth sign in (account.provider is google), ALWAYS fetch from database to get the internal DB ID
      // The user.id coming from Google provider is the Google ID, not our DB ID
      if (account?.provider === 'google' && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: {
              id: true,
              role: true,
              avatar: true,
            },
          })

          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.avatar = dbUser.avatar || token.avatar
          }
        } catch (error) {
          logger.error('[Auth] Error fetching user in jwt callback for OAuth:', error)
        }
      }

      // Fetch latest user data from DB *occasionally* (throttled), not on every request.
      // Store the last refresh timestamp on the token to reduce DB load.
      const nowSeconds = Math.floor(Date.now() / 1000)
      const t: any = token as any
      const lastRefreshedAt = typeof t._dbRefreshedAt === 'number' ? t._dbRefreshedAt : 0
      const shouldRefresh =
        trigger === 'update' ||
        (token.id && nowSeconds - lastRefreshedAt >= USER_REFRESH_MIN_INTERVAL_SECONDS)

      if (token.id && shouldRefresh) {
        try {
          // Use Promise.race to add timeout
          const dbUser = await Promise.race([
            prisma.user.findUnique({
              where: { id: token.id as string },
              select: {
                role: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Query timeout')), 5000)
            ),
          ]) as any

          if (dbUser) {
            token.role = dbUser.role
            token.avatar = dbUser.avatar
              ; (token as any)._dbRefreshedAt = nowSeconds
          }
        } catch (error: any) {
          // Log error but don't throw - allow token to proceed with existing data
          // Connection pool errors are common and should not block authentication
          if (
            error?.message?.includes('connection pool') ||
            error?.message?.includes('timeout') ||
            error?.message?.includes('Query timeout')
          ) {
            if (process.env.NODE_ENV === 'development') {
              logger.warn('[Auth] Connection pool timeout, using cached token data')
            }
          } else {
            logger.error('[Auth] Error fetching user data in jwt callback:', error)
          }
        }
      }

      // Refresh user data if needed
      if (trigger === 'update') {
        try {
          // Use timeout to prevent connection pool issues
          const updatedUser = await Promise.race([
            prisma.user.findUnique({
              where: { id: token.id as string },
              select: {
                role: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Query timeout')), 5000)
            ),
          ]) as any

          if (updatedUser) {
            token.role = updatedUser.role
            token.avatar = updatedUser.avatar
              ; (token as any)._dbRefreshedAt = nowSeconds
          }
        } catch (error: any) {
          // Connection pool errors should not block token refresh
          if (
            error?.message?.includes('connection pool') ||
            error?.message?.includes('timeout') ||
            error?.message?.includes('Query timeout')
          ) {
            if (process.env.NODE_ENV === 'development') {
              logger.warn('[Auth] Connection pool timeout during user refresh, using existing token data')
            }
          } else {
            logger.error('[Auth] Error updating user data in jwt callback:', error)
          }
        }
      }

      // Check token expiration
      if (token.exp && typeof token.exp === 'number' && token.exp < nowSeconds) {
        throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.')
      }

      return token
    },
    async session({ session, token }) {
      // If token doesn't have id or role, try to fetch from database using email
      if (!token.id && session.user?.email) {
        try {
          // Add timeout to prevent hanging on slow DB connections
          const user = await Promise.race([
            prisma.user.findUnique({
              where: { email: session.user.email },
              select: {
                id: true,
                role: true,
                avatar: true,
                firstName: true,
                lastName: true,
              },
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Session callback timeout')), 3000)
            ),
          ]) as any

          if (user) {
            token.id = user.id
            token.role = user.role
            token.avatar = user.avatar
          }
        } catch (error: any) {
          // Don't throw error - just log and continue with existing token
          if (error?.message?.includes('timeout') || error?.message?.includes('connection')) {
            logger.warn('[Auth] DB timeout in session callback, using cached token data')
          } else {
            logger.error('[Auth] Error fetching user in session callback:', error)
          }
        }
      }

      if (session.user && token) {
        session.user.role = (token.role as string) || 'STUDENT'
        session.user.id = (token.id as string) || ''
        session.user.email = (token.email as string) || session.user.email || ''
        // Sync avatar from database to session
        session.user.image = (token.avatar as string) || session.user.image || null
      }

      // DON'T throw error - gracefully handle missing data
      // Cloud Run cold starts can cause DB connection issues
      if (!token.id && !session.user?.email) {
        logger.error('[Auth] Session validation warning: missing id and email')
        // Return session anyway - don't block user
        // The auth system will handle this gracefully
      }

      // Set default role if missing
      if (!token.role) {
        token.role = 'STUDENT'
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

