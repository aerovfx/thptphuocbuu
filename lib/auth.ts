import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email và mật khẩu là bắt buộc')
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            throw new Error('Email hoặc mật khẩu không đúng')
          }

          // Check if user has password (not OAuth-only user)
          if (!user.password) {
            throw new Error('Tài khoản này chỉ đăng nhập bằng Google. Vui lòng sử dụng Google để đăng nhập.')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error('Email hoặc mật khẩu không đúng')
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            image: user.avatar
          }
        } catch (error: any) {
          throw new Error(error.message || 'Đăng nhập thất bại')
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
          console.error('OAuth sign in error:', error)
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
        token.email = user.email
        // Map avatar from user object (could be from credentials or OAuth)
        token.avatar = (user as any).avatar || (user as any).image || null
      }

      // Always fetch latest avatar from database to ensure sync
      if (token.id) {
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
      }

      // Refresh user data if needed
      if (trigger === 'update') {
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
      }

      // Check token expiration
      const now = Math.floor(Date.now() / 1000)
      if (token.exp && token.exp < now) {
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
  debug: process.env.NODE_ENV === 'development',
}

