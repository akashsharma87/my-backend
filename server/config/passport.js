const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Serialize/Deserialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL ||
    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  console.log('🔐 Google OAuth configured with callback:', googleCallbackURL);

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: googleCallbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔍 Google profile received:', JSON.stringify(profile, null, 2));

      // Check if user already exists with this Google ID
      let user = await User.findOne({
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
        ]
      });

      if (user) {
        // Update Google ID if not set
        if (!user.googleId) {
          user.googleId = profile.id;
          // Use updateOne to bypass validation on existing data
          await User.updateOne({ _id: user._id }, { googleId: profile.id });
        }
        return done(null, user);
      }

      // Helper function to safely truncate strings
      const truncate = (str, maxLength) => {
        if (!str) return '';
        return str.length > maxLength ? str.substring(0, maxLength) : str;
      };

      // Create new user - only use basic Google profile data
      user = new User({
        googleId: profile.id,
        fullName: truncate(profile.displayName, 100),
        email: profile.emails[0].value,
        userType: 'engineer', // Default, can be changed later
        profilePicture: profile.photos[0]?.value,
        isActive: true,
        profileCompleted: false,
        // Explicitly set optional fields to empty strings
        // DO NOT use any Google profile data for these fields
        bio: '',
        location: '',
        website: '',
        phone: '',
        company: '',
        jobTitle: '',
        experience: '',
        linkedin: '',
        github: '',
        portfolio: '',
        currentRole: '',
        salaryExpectation: ''
      });

      await user.save();
      console.log('✅ New user created via Google OAuth:', user.email);
      done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      console.error('Error details:', error.errors);
      done(error, null);
    }
  }));
}

// GitHub Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  const githubCallbackURL = process.env.GITHUB_CALLBACK_URL ||
    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/github/callback`;

  console.log('🔐 GitHub OAuth configured with callback:', githubCallbackURL);

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: githubCallbackURL,
    scope: ['user:email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this GitHub ID
      let user = await User.findOne({ 
        $or: [
          { githubId: profile.id },
          { email: profile.emails?.[0]?.value }
        ]
      });

      if (user) {
        // Update GitHub ID if not set
        if (!user.githubId) {
          user.githubId = profile.id;
          // Use updateOne to bypass validation on existing data
          await User.updateOne({ _id: user._id }, { githubId: profile.id });
        }
        return done(null, user);
      }

      // Create new user
      user = new User({
        githubId: profile.id,
        fullName: profile.displayName || profile.username,
        email: profile.emails?.[0]?.value || `${profile.username}@github.local`,
        userType: 'engineer', // Default, can be changed later
        profilePicture: profile.photos[0]?.value,
        isActive: true,
        profileCompleted: false,
        // Explicitly set optional fields to empty strings to avoid validation issues
        bio: '',
        location: '',
        website: '',
        phone: '',
        company: '',
        jobTitle: '',
        experience: '',
        linkedin: '',
        github: profile.html_url || '', // Use GitHub profile URL
        portfolio: '',
        currentRole: '',
        salaryExpectation: ''
      });

      await user.save();
      console.log('✅ New user created via GitHub OAuth:', user.email);
      done(null, user);
    } catch (error) {
      console.error('❌ GitHub OAuth error:', error);
      done(error, null);
    }
  }));
}

module.exports = passport;