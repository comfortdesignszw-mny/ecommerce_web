import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
           'Password must contain uppercase, lowercase, number, and special character'),
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  bio: z.string().min(10, 'Business description must be at least 10 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = registrationSchema.parse(body)

    // Check if admin with this email already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: validatedData.email }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An admin with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create new admin user with PENDING status
    const newAdmin = await prisma.adminUser.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        storeName: validatedData.storeName,
        bio: validatedData.bio,
        role: 'REGULAR',
        status: 'PENDING',
      },
      select: {
        id: true,
        name: true,
        email: true,
        storeName: true,
        status: true,
        createdAt: true,
      }
    })

    // TODO: Send email notification to super admin
    // TODO: Send confirmation email to new admin

    return NextResponse.json({
      message: 'Registration submitted successfully. Your account is pending approval.',
      admin: newAdmin
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Admin registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}