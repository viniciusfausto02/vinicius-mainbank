/**
 * Environment Validation & Configuration
 * Ensures all critical environment variables are set at startup
 */

type EnvConfig = {
  database: {
    url: string;
  };
  auth: {
    secret: string;
    url: string;
    googleId?: string;
    googleSecret?: string;
  };
  encryption: {
    key: string;
    salt: string;
  };
  app: {
    environment: 'development' | 'production' | 'test';
    nodeEnv: string;
  };
};

class EnvironmentValidator {
  private config: EnvConfig | null = null;
  private errors: string[] = [];

  validate(): EnvConfig {
    if (this.config) return this.config;

    this.validateRequired();
    this.validateEncryption();

    if (this.errors.length > 0) {
      const errorMessage = `\n❌ Environment Configuration Errors:\n${this.errors.map((e) => `  • ${e}`).join('\n')}\n`;
      console.error(errorMessage);
      throw new Error(`Environment validation failed: ${this.errors.length} errors`);
    }

    this.config = {
      database: {
        url: process.env.DATABASE_URL!,
      },
      auth: {
        secret: process.env.NEXTAUTH_SECRET!,
        url: process.env.NEXTAUTH_URL!,
        googleId: process.env.GOOGLE_ID,
        googleSecret: process.env.GOOGLE_SECRET,
      },
      encryption: {
        key: process.env.ENCRYPTION_KEY!,
        salt: process.env.ENCRYPTION_SALT!,
      },
      app: {
        environment: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
        nodeEnv: process.env.NODE_ENV || 'development',
      },
    };

    console.log('✅ Environment configuration validated successfully');
    return this.config;
  }

  private validateRequired(): void {
    const required = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'ENCRYPTION_KEY',
      'ENCRYPTION_SALT',
    ];

    for (const key of required) {
      if (!process.env[key]) {
        this.errors.push(`Missing required: ${key}`);
      }
    }
  }

  private validateEncryption(): void {
    const key = process.env.ENCRYPTION_KEY;
    const salt = process.env.ENCRYPTION_SALT;

    if (key && key.length < 64) {
      this.errors.push('ENCRYPTION_KEY must be at least 64 hex characters (32 bytes)');
    }

    if (salt && salt.length < 32) {
      this.errors.push('ENCRYPTION_SALT must be at least 32 hex characters (16 bytes)');
    }

    // Validate hex format
    if (key && !/^[0-9a-f]*$/i.test(key)) {
      this.errors.push('ENCRYPTION_KEY must be valid hex string');
    }

    if (salt && !/^[0-9a-f]*$/i.test(salt)) {
      this.errors.push('ENCRYPTION_SALT must be valid hex string');
    }
  }

  getConfig(): EnvConfig {
    return this.validate();
  }
}

export const envValidator = new EnvironmentValidator();
export const env = envValidator.getConfig();

// Helper to check environment
export const isDevelopment = () => env.app.environment === 'development';
export const isProduction = () => env.app.environment === 'production';
export const isTest = () => env.app.environment === 'test';
