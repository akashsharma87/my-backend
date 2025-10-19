const mongoose = require('mongoose');

/**
 * Database optimization utilities
 */

/**
 * Create indexes for better query performance
 */
const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    // User collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ userType: 1 });
    await db.collection('users').createIndex({ isActive: 1 });
    await db.collection('users').createIndex({ createdAt: -1 });
    
    // Resume collection indexes
    await db.collection('resumes').createIndex({ userId: 1 });
    await db.collection('resumes').createIndex({ isActive: 1 });
    await db.collection('resumes').createIndex({ skills: 1 });
    await db.collection('resumes').createIndex({ experienceYears: 1 });
    await db.collection('resumes').createIndex({ location: 1 });
    await db.collection('resumes').createIndex({ createdAt: -1 });
    await db.collection('resumes').createIndex({ updatedAt: -1 });
    await db.collection('resumes').createIndex({ activationExpiresAt: 1 });
    
    // Compound indexes for common queries
    await db.collection('resumes').createIndex({ 
      isActive: 1, 
      skills: 1, 
      experienceYears: 1 
    });
    await db.collection('resumes').createIndex({ 
      userId: 1, 
      isActive: 1, 
      createdAt: -1 
    });
    
    // Note: Text search index is already created in Resume model schema
    // No need to create additional text indexes here as MongoDB only allows one per collection
    
    // Job collection indexes
    await db.collection('jobs').createIndex({ employerId: 1 });
    await db.collection('jobs').createIndex({ isActive: 1 });
    await db.collection('jobs').createIndex({ requiredSkills: 1 });
    await db.collection('jobs').createIndex({ experienceLevel: 1 });
    await db.collection('jobs').createIndex({ jobType: 1 });
    await db.collection('jobs').createIndex({ location: 1 });
    await db.collection('jobs').createIndex({ createdAt: -1 });
    
    // Compound indexes for job queries
    await db.collection('jobs').createIndex({ 
      isActive: 1, 
      requiredSkills: 1, 
      experienceLevel: 1 
    });
    
    // Note: Text search index is already created in Job model schema
    // No need to create additional text indexes here as MongoDB only allows one per collection
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
  }
};

/**
 * Optimize database connection settings
 */
const optimizeConnection = () => {
  try {
    // Set read preference for better performance (only if connected)
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      mongoose.connection.db.readPreference = 'secondaryPreferred';
    }

    // Set mongoose-specific options (not connection options)
    mongoose.set('bufferCommands', false);
    mongoose.set('strictQuery', false); // Allow flexible queries

    console.log('✅ Database connection optimized');
  } catch (error) {
    console.warn('⚠️ Database optimization warning:', error.message);
  }
};

/**
 * Analyze slow queries and suggest optimizations
 */
const analyzeSlowQueries = async () => {
  try {
    const db = mongoose.connection.db;
    
    // Enable profiling for slow operations (>100ms)
    await db.command({ profile: 2, slowms: 100 });
    
    // Get profiling data
    const profilingData = await db.collection('system.profile')
      .find({})
      .sort({ ts: -1 })
      .limit(10)
      .toArray();
    
    if (profilingData.length > 0) {
      console.log('🐌 Recent slow queries:');
      profilingData.forEach((query, index) => {
        console.log(`${index + 1}. Duration: ${query.millis}ms`);
        console.log(`   Collection: ${query.ns}`);
        console.log(`   Command: ${JSON.stringify(query.command, null, 2)}`);
        console.log('---');
      });
    } else {
      console.log('✅ No slow queries detected');
    }
  } catch (error) {
    console.error('❌ Error analyzing slow queries:', error);
  }
};

/**
 * Clean up expired data
 */
const cleanupExpiredData = async () => {
  try {
    const now = new Date();
    
    // Clean up expired resumes
    const expiredResumes = await mongoose.connection.db.collection('resumes')
      .updateMany(
        { 
          isActive: true, 
          activationExpiresAt: { $lt: now } 
        },
        { 
          $set: { isActive: false } 
        }
      );
    
    // Clean up old session data (if using MongoDB session store)
    const oldSessions = await mongoose.connection.db.collection('sessions')
      .deleteMany({
        expires: { $lt: now }
      });
    
    console.log(`✅ Cleanup completed:`);
    console.log(`   - Deactivated ${expiredResumes.modifiedCount} expired resumes`);
    console.log(`   - Removed ${oldSessions.deletedCount} old sessions`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

/**
 * Get database statistics
 */
const getDatabaseStats = async () => {
  try {
    const db = mongoose.connection.db;
    
    // Get database stats
    const dbStats = await db.stats();
    
    // Get collection stats
    const collections = ['users', 'resumes', 'jobs'];
    const collectionStats = {};
    
    for (const collection of collections) {
      try {
        const stats = await db.collection(collection).stats();
        collectionStats[collection] = {
          count: stats.count,
          size: stats.size,
          avgObjSize: stats.avgObjSize,
          indexCount: stats.nindexes,
          indexSize: stats.totalIndexSize
        };
      } catch (error) {
        collectionStats[collection] = { error: 'Collection not found' };
      }
    }
    
    return {
      database: {
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        indexSize: dbStats.indexSize,
        storageSize: dbStats.storageSize
      },
      collections: collectionStats
    };
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    return null;
  }
};

/**
 * Optimize queries with aggregation pipeline
 */
const createOptimizedQueries = () => {
  return {
    // Optimized resume search with aggregation
    searchResumes: (filters) => {
      const pipeline = [];
      
      // Match stage
      const matchStage = { isActive: true };
      
      if (filters.skills && filters.skills.length > 0) {
        matchStage.skills = { $in: filters.skills };
      }
      
      if (filters.minExperience !== undefined) {
        matchStage.experienceYears = { $gte: filters.minExperience };
      }
      
      if (filters.maxExperience !== undefined) {
        matchStage.experienceYears = { 
          ...matchStage.experienceYears, 
          $lte: filters.maxExperience 
        };
      }
      
      if (filters.location) {
        matchStage.location = new RegExp(filters.location, 'i');
      }
      
      pipeline.push({ $match: matchStage });
      
      // Lookup user data
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            { $project: { fullName: 1, email: 1 } }
          ]
        }
      });
      
      // Unwind user array
      pipeline.push({ $unwind: '$user' });
      
      // Sort by relevance (skills match count) and date
      if (filters.skills && filters.skills.length > 0) {
        pipeline.push({
          $addFields: {
            skillsMatchCount: {
              $size: {
                $setIntersection: ['$skills', filters.skills]
              }
            }
          }
        });
        pipeline.push({ 
          $sort: { 
            skillsMatchCount: -1, 
            updatedAt: -1 
          } 
        });
      } else {
        pipeline.push({ $sort: { updatedAt: -1 } });
      }
      
      // Pagination
      if (filters.skip) {
        pipeline.push({ $skip: filters.skip });
      }
      
      if (filters.limit) {
        pipeline.push({ $limit: filters.limit });
      }
      
      return pipeline;
    },
    
    // Optimized job search
    searchJobs: (filters) => {
      const pipeline = [];
      
      const matchStage = { isActive: true };
      
      if (filters.skills && filters.skills.length > 0) {
        matchStage.requiredSkills = { $in: filters.skills };
      }
      
      if (filters.experienceLevel) {
        matchStage.experienceLevel = filters.experienceLevel;
      }
      
      if (filters.jobType) {
        matchStage.jobType = filters.jobType;
      }
      
      if (filters.location) {
        matchStage.location = new RegExp(filters.location, 'i');
      }
      
      pipeline.push({ $match: matchStage });
      
      // Lookup employer data
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'employerId',
          foreignField: '_id',
          as: 'employer',
          pipeline: [
            { $project: { fullName: 1, email: 1 } }
          ]
        }
      });
      
      pipeline.push({ $unwind: '$employer' });
      pipeline.push({ $sort: { createdAt: -1 } });
      
      if (filters.skip) {
        pipeline.push({ $skip: filters.skip });
      }
      
      if (filters.limit) {
        pipeline.push({ $limit: filters.limit });
      }
      
      return pipeline;
    }
  };
};

/**
 * Schedule regular maintenance tasks
 */
const scheduleMaintenanceTasks = () => {
  // Run cleanup every hour
  setInterval(cleanupExpiredData, 60 * 60 * 1000);
  
  // Analyze slow queries every 6 hours
  setInterval(analyzeSlowQueries, 6 * 60 * 60 * 1000);
  
  console.log('✅ Maintenance tasks scheduled');
};

module.exports = {
  createIndexes,
  optimizeConnection,
  analyzeSlowQueries,
  cleanupExpiredData,
  getDatabaseStats,
  createOptimizedQueries,
  scheduleMaintenanceTasks
};
