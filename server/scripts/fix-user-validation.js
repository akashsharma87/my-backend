/**
 * Script to fix existing users with validation issues
 * Truncates bio and experience fields that exceed max length
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Define User schema without validation for this script
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function fixUserValidation() {
  try {
    console.log('🔍 Finding users with validation issues...');
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    let fixedCount = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      const updates = {};
      
      // Check and truncate bio
      if (user.bio && user.bio.length > 500) {
        updates.bio = user.bio.substring(0, 500);
        needsUpdate = true;
        console.log(`📝 Truncating bio for user ${user.email}: ${user.bio.length} -> 500 chars`);
      }
      
      // Check and truncate experience
      if (user.experience && user.experience.length > 1000) {
        updates.experience = user.experience.substring(0, 1000);
        needsUpdate = true;
        console.log(`📝 Truncating experience for user ${user.email}: ${user.experience.length} -> 1000 chars`);
      }
      
      // Check and truncate other fields
      const fieldLimits = {
        fullName: 100,
        location: 100,
        website: 255,
        phone: 20,
        company: 100,
        jobTitle: 100,
        linkedin: 255,
        github: 255,
        portfolio: 255,
        currentRole: 100,
        salaryExpectation: 100
      };
      
      for (const [field, maxLength] of Object.entries(fieldLimits)) {
        if (user[field] && user[field].length > maxLength) {
          updates[field] = user[field].substring(0, maxLength);
          needsUpdate = true;
          console.log(`📝 Truncating ${field} for user ${user.email}: ${user[field].length} -> ${maxLength} chars`);
        }
      }
      
      // Update user if needed
      if (needsUpdate) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        fixedCount++;
        console.log(`✅ Fixed user: ${user.email}`);
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} users with validation issues`);
    
  } catch (error) {
    console.error('❌ Error fixing users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
fixUserValidation();

