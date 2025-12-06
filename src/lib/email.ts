/**
 * Email Service for ViniBank
 * Handles all outgoing email communications
 * 
 * Currently configured for development/testing
 * In production, integrate with SendGrid, AWS SES, or similar
 */

import nodemailer from 'nodemailer';
import { logger } from './logger';

// Email templates
const templates = {
  passwordReset: (resetUrl: string, expiresIn: string) => ({
    subject: '🔐 Password Recovery - ViniBank',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px;">🏦 ViniBank</h1>
        </div>
        
        <h2 style="color: #333; margin-top: 0;">Password Recovery Request</h2>
        
        <p style="color: #666; line-height: 1.6;">
          We received a request to reset your ViniBank password. Click the button below to create a new password.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #999; font-size: 12px;">
          Or copy and paste this link in your browser:<br/>
          <code style="background: #f5f5f5; padding: 8px; display: block; margin: 10px 0; word-break: break-all;">
            ${resetUrl}
          </code>
        </p>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <strong style="color: #856404;">⏱️ This link expires in ${expiresIn}</strong>
          <p style="color: #856404; margin: 5px 0 0 0; font-size: 14px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
          This is an automated message. Please do not reply to this email.
        </p>
        
        <p style="color: #999; font-size: 12px;">
          ViniBank Security Team<br/>
          <a href="https://vinibank.com" style="color: #667eea; text-decoration: none;">https://vinibank.com</a>
        </p>
      </div>
    `,
    text: `
Password Recovery Request

We received a request to reset your ViniBank password. Click the link below to create a new password.

${resetUrl}

This link expires in ${expiresIn}

If you didn't request this, please ignore this email.

ViniBank Security Team
https://vinibank.com
    `,
  }),

  emailVerification: (verifyUrl: string, expiresIn: string) => ({
    subject: '✅ Verify Your Email - ViniBank',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px;">🏦 ViniBank</h1>
        </div>
        
        <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
        
        <p style="color: #666; line-height: 1.6;">
          Thank you for signing up! Please verify your email address to complete your account setup.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        
        <p style="color: #999; font-size: 12px;">
          Or copy and paste this link in your browser:<br/>
          <code style="background: #f5f5f5; padding: 8px; display: block; margin: 10px 0; word-break: break-all;">
            ${verifyUrl}
          </code>
        </p>
        
        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <strong style="color: #155724;">✓ Link expires in ${expiresIn}</strong>
          <p style="color: #155724; margin: 5px 0 0 0; font-size: 14px;">
            Once verified, you can access all ViniBank features.
          </p>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `
Email Verification

Thank you for signing up! Please verify your email address to complete your account setup.

${verifyUrl}

This link expires in ${expiresIn}

Once verified, you can access all ViniBank features.

ViniBank Team
https://vinibank.com
    `,
  }),
};

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Development: use Ethereal Email (temporary test service)
    // Production: use SendGrid, AWS SES, or similar
    if (process.env.NODE_ENV === 'development') {
      // For development, we log instead of actually sending
      logger.info('EmailService: Running in development mode (no emails sent)');
    } else {
      // Production configuration
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = parseInt(process.env.SMTP_PORT || '587', 10);

      if (!user || !pass) {
        logger.warn('EmailService: SMTP credentials not configured');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
  }

  async sendPasswordReset(
    email: string,
    resetUrl: string,
    expiresInHours: number = 24
  ): Promise<boolean> {
    try {
      const template = templates.passwordReset(resetUrl, `${expiresInHours} hours`);

      if (process.env.NODE_ENV === 'development') {
        logger.info(`[EMAIL] Password reset link for ${email}:`, { resetUrl });
        return true;
      }

      if (!this.transporter) {
        logger.error('EmailService: Transporter not configured');
        return false;
      }

      const result = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@vinibank.com',
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info(`Email sent: ${result.messageId}`);
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send password reset email', err, { email });
      return false;
    }
  }

  async sendEmailVerification(
    email: string,
    verifyUrl: string,
    expiresInHours: number = 24
  ): Promise<boolean> {
    try {
      const template = templates.emailVerification(verifyUrl, `${expiresInHours} hours`);

      if (process.env.NODE_ENV === 'development') {
        logger.info(`[EMAIL] Email verification link for ${email}:`, { verifyUrl });
        return true;
      }

      if (!this.transporter) {
        logger.error('EmailService: Transporter not configured');
        return false;
      }

      const result = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@vinibank.com',
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info(`Email sent: ${result.messageId}`);
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send email verification', err, { email });
      return false;
    }
  }
}

// Singleton instance
export const emailService = new EmailService();
