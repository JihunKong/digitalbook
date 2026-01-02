import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { getDatabase } from './database';
import { AuthProvider, UserRole } from '@prisma/client';
import { logger } from '../utils/logger';

// JWT Strategy for API authentication
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET!,
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const prisma = getDatabase();
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        teacherProfile: true,
        studentProfile: true,
        adminProfile: true,
      },
    });

    if (user && user.isActive) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL!,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const prisma = getDatabase();
    
    // Check if user already exists with this Google account
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { providerId: profile.id, provider: AuthProvider.GOOGLE },
          { email: profile.emails?.[0]?.value }
        ]
      },
      include: {
        teacherProfile: true,
        studentProfile: true,
        adminProfile: true,
      },
    });

    if (user) {
      // Update existing user with Google provider info if needed
      if (user.provider === AuthProvider.LOCAL) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: AuthProvider.GOOGLE,
            providerId: profile.id,
            lastLoginAt: new Date(),
          },
          include: {
            teacherProfile: true,
            studentProfile: true,
            adminProfile: true,
          },
        });
      } else {
        // Just update last login
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
          include: {
            teacherProfile: true,
            studentProfile: true,
            adminProfile: true,
          },
        });
      }

      logger.info(`Google OAuth login: ${user.email}`);
      return done(null, user);
    }

    // Create new user - but we need role selection first
    // Return profile data for role selection step
    const userData = {
      googleProfile: profile,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      needsSetup: true,
    };

    logger.info(`Google OAuth new user: ${userData.email}`);
    return done(null, userData);
  } catch (error) {
    logger.error('Google OAuth error:', error);
    return done(error, false);
  }
}));

// Serialize/Deserialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id || user.googleProfile?.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const prisma = getDatabase();
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        teacherProfile: true,
        studentProfile: true,
        adminProfile: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;