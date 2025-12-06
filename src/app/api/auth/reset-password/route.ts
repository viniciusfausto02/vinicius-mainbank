/**
 * Password Reset API Endpoint
 * Validates reset token and updates password
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, keyForRequest } from '@/lib/rateLimit';
import { hash } from 'bcryptjs';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 attempts per hour per IP
    const rateKey = keyForRequest(req, 'reset-password');
    if (!rateLimit({ key: rateKey, tokensPerInterval: 10, intervalMs: 3_600_000 })) {
      logger.warn('Rate limit exceeded for reset-password', { ip: rateKey });
      return NextResponse.json(
        { error: 'Too many password reset attempts. Try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json() as { token: string; email: string; password: string };
    const { token, email, password } = body;

    // Validate inputs
    if (!token || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    // Find reset token
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
    });

    // Validate token
    if (!resetRecord) {
      logger.warn('Invalid password reset token provided');
      return NextResponse.json(
        { error: 'Invalid or expired reset link.' },
        { status: 400 }
      );
    }

    // Check token hasn't expired
    if (resetRecord.expiresAt < new Date()) {
      logger.warn('Expired password reset token used', { email });
      return NextResponse.json(
        { error: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check token hasn't been used already
    if (resetRecord.usedAt) {
      logger.warn('Already-used password reset token attempted', { email });
      return NextResponse.json(
        { error: 'This reset link has already been used.' },
        { status: 400 }
      );
    }

    // Verify email matches
    if (resetRecord.email.toLowerCase() !== email.toLowerCase()) {
      logger.warn('Password reset email mismatch', { recordEmail: resetRecord.email, providedEmail: email });
      return NextResponse.json(
        { error: 'Invalid reset link.' },
        { status: 400 }
      );
    }

    // Find user and update password
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      logger.error('User not found during password reset', new Error('User not found'), { email });
      return NextResponse.json(
        { error: 'User account not found.' },
        { status: 404 }
      );
    }

    // Hash new password
    const passwordHash = await hash(password, 12);

    // Update password and mark token as used (in transaction for safety)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    logger.info('Password reset successful', { userId: user.id, email: user.email });

    return NextResponse.json(
      { message: 'Your password has been reset successfully. You can now log in.' },
      { status: 200 }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error in reset-password endpoint', err);
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
