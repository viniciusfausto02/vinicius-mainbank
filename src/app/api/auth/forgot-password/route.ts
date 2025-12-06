/**
 * Password Recovery API Endpoints
 * Implements secure password recovery flow with email verification
 */

// POST /api/auth/forgot-password
// Request password recovery email
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';
import { rateLimit, keyForRequest } from '@/lib/rateLimit';
import { randomBytes } from 'crypto';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 requests per hour per IP (prevent email spam)
    const rateKey = keyForRequest(req, 'forgot-password');
    if (!rateLimit({ key: rateKey, tokensPerInterval: 5, intervalMs: 3_600_000 })) {
      logger.warn('Rate limit exceeded for forgot-password', { ip: rateKey });
      return NextResponse.json(
        { error: 'Too many password recovery requests. Try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json() as { email: string };
    const { email } = body;

    // Validate email format
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    // Security: Return same response whether email exists or not (prevent email enumeration)
    if (!user) {
      logger.info('Password recovery requested for non-existent email', { email });
      return NextResponse.json(
        { message: 'If an account exists with this email, a recovery link has been sent.' },
        { status: 200 }
      );
    }

    // Generate secure reset token (256-bit)
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Clean up old reset tokens for this email
    await prisma.passwordReset.deleteMany({
      where: {
        email: user.email,
        expiresAt: { lt: new Date() }, // Delete expired tokens
      },
    });

    // Create new reset token
    const resetRecord = await prisma.passwordReset.create({
      data: {
        email: user.email,
        token,
        expiresAt,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        userAgent: req.headers.get('user-agent'),
      },
    });

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    // Send email
    const emailSent = await emailService.sendPasswordReset(user.email, resetUrl, 24);

    if (!emailSent) {
      logger.error('Failed to send password reset email', new Error('Email send failed'), { userId: user.id, email: user.email });
      return NextResponse.json(
        { error: 'Failed to send recovery email. Please try again later.' },
        { status: 500 }
      );
    }

    logger.info('Password recovery email sent', { userId: user.id, email: user.email });

    return NextResponse.json(
      { message: 'If an account exists with this email, a recovery link has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error in forgot-password endpoint', err);
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
