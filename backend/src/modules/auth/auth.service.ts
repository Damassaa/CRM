import prisma from '../../config/database';
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors/AppError';
import { hashPassword, comparePassword, generateToken } from '../../shared/utils/crypto';
import { generateTokenPair, verifyRefreshToken } from '../../shared/utils/jwt';

export class AuthService {
  async login(email: string, password: string, ipAddress?: string) {
    // Find user
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        tenant: {
          select: {
            id: true,
            status: true,
            companyName: true,
          },
        },
      },
    });

    if (!user || !user.password) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if tenant is active
    if (user.tenant.status !== 'ACTIVE' && user.tenant.status !== 'TRIAL') {
      throw new AuthenticationError('Account is not active');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN',
        resource: 'auth',
        ipAddress,
      },
    });

    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.companyName,
        },
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        tenantId: true,
        role: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Generate new tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });

    return tokens;
  }

  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        canCreateLeads: true,
        canEditLeads: true,
        canDeleteLeads: true,
        canMoveLeads: true,
        viewAllLeads: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            companyName: true,
            status: true,
            plan: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findFirst({
      where: { email },
    });

    // Don't reveal if user exists (security)
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = generateToken();
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpiresAt,
      },
    });

    // TODO: Send email with reset link
    // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await emailService.sendPasswordResetEmail(user.email, resetLink);

    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpiresAt: null,
      },
    });
  }

  async setPasswordWithInvite(token: string, password: string) {
    const user = await prisma.user.findFirst({
      where: {
        inviteToken: token,
        inviteExpiresAt: {
          gt: new Date(),
        },
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired invite token');
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        inviteToken: null,
        inviteExpiresAt: null,
      },
    });

    // Generate tokens for auto-login
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.companyName,
        },
      },
      ...tokens,
    };
  }

  async superAdminLogin(email: string, password: string) {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email },
    });

    if (!superAdmin) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, superAdmin.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate tokens (no tenantId for super admin)
    const tokens = generateTokenPair({
      id: superAdmin.id,
      email: superAdmin.email,
    });

    return {
      superAdmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
      },
      ...tokens,
    };
  }
}
