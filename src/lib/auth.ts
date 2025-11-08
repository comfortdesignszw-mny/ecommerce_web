import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { AdminUser } from '@/types'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const adminUser = await prisma.adminUser.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!adminUser) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          adminUser.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Only allow approved admins to log in
        if (adminUser.status !== 'APPROVED') {
          return null
        }

        return {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          storeName: adminUser.storeName,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.storeName = user.storeName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.storeName = token.storeName as string
      }
      return session
    }
  },
  pages: {
    signIn: '/admin/login',
  }
}

export default NextAuth(authOptions)