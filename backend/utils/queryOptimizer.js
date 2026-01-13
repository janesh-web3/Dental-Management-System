/**
 * Query Optimization Utilities
 * Provides optimized query patterns and caching mechanisms
 */

const NodeCache = require('node-cache');

// Create cache instance with 5-minute TTL
const queryCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Better performance, but be careful with object mutations
});

/**
 * Optimized patient search with caching
 */
const optimizedPatientSearch = async (Patient, query, limit = 10) => {
  const cacheKey = `patient_search_${query}_${limit}`;
  
  // Check cache first
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Use text search index for better performance
  const searchResults = await Patient.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .limit(Number(limit))
  .select('personalDetails.name personalDetails.contactNumber personalDetails.emailAddress lastAppointment')
  .lean();

  // Cache the results
  queryCache.set(cacheKey, searchResults);
  return searchResults;
};

/**
 * Optimized patient filtering with early pipeline optimization
 */
const optimizedPatientFilter = async (Patient, filters) => {
  const {
    treatmentStatus,
    procedure,
    group,
    from,
    to,
    gender,
    patientStatus,
    limit = 100,
    page = 1,
    skip = 0
  } = filters;

  // Build match conditions early in pipeline
  const matchConditions = {};
  
  if (gender && gender !== 'all') {
    matchConditions['personalDetails.gender'] = gender;
  }
  
  if (patientStatus && patientStatus !== 'all') {
    matchConditions['patientStatus'] = patientStatus;
  }

  // Date range filter
  if (from || to) {
    matchConditions.createdAt = {};
    if (from) matchConditions.createdAt.$gte = new Date(from);
    if (to) matchConditions.createdAt.$lte = new Date(to);
  }

  // Build aggregation pipeline with early $match
  const pipeline = [
    { $match: matchConditions },
    { $limit: Number(limit) + Number(skip) }, // Limit early to reduce processing
    { $skip: Number(skip) }
  ];

  // Add group filter if specified
  if (group && group !== 'all') {
    pipeline.push({
      $match: {
        $or: [
          { 'medicalDetails.group': group },
          { 'medicalDetails.treatmentPlanning.groupTreatmentDetails.groupName': group }
        ]
      }
    });
  }

  // Add procedure filter if specified
  if (procedure && procedure !== 'all') {
    pipeline.push({
      $match: {
        $or: [
          { 'medicalDetails.treatmentPlanning.selectedTeethDetails.procedure': procedure },
          { 'medicalDetails.treatmentPlanning.groupTreatmentDetails.procedure': procedure },
          { 'medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.procedure': procedure }
        ]
      }
    });
  }

  // Project only necessary fields to reduce memory usage
  pipeline.push({
    $project: {
      personalDetails: 1,
      medicalDetails: 1,
      createdAt: 1,
      updatedAt: 1,
      patientStatus: 1
    }
  });

  return await Patient.aggregate(pipeline);
};

/**
 * Optimized analytics queries with caching
 */
const optimizedAnalyticsQuery = async (model, queryType, dateRange, additionalFilters = {}) => {
  const cacheKey = `analytics_${queryType}_${JSON.stringify(dateRange)}_${JSON.stringify(additionalFilters)}`;
  
  // Check cache first
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { start, end } = dateRange;
  const baseMatch = {
    createdAt: { $gte: start, $lte: end },
    isDeleted: { $ne: true },
    ...additionalFilters
  };

  let result;
  
  switch (queryType) {
    case 'revenue_summary':
      result = await model.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            totalTransactions: { $sum: 1 },
            avgTransaction: { $avg: '$amount' }
          }
        }
      ]);
      break;
      
    case 'daily_revenue':
      result = await model.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
      break;
      
    case 'payment_methods':
      result = await model.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$paymentMethod',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]);
      break;
      
    default:
      throw new Error(`Unknown query type: ${queryType}`);
  }

  // Cache the results for 5 minutes
  queryCache.set(cacheKey, result, 300);
  return result;
};

/**
 * Batch processing utility for large datasets
 */
const processBatch = async (model, query, batchSize = 1000, processor) => {
  let skip = 0;
  let hasMore = true;
  const results = [];

  while (hasMore) {
    const batch = await model.find(query)
      .skip(skip)
      .limit(batchSize)
      .lean();

    if (batch.length === 0) {
      hasMore = false;
    } else {
      const processedBatch = await processor(batch);
      results.push(...processedBatch);
      skip += batchSize;
    }
  }

  return results;
};

/**
 * Clear cache for specific patterns
 */
const clearCache = (pattern) => {
  const keys = queryCache.keys();
  const keysToDelete = keys.filter(key => key.includes(pattern));
  queryCache.del(keysToDelete);
  console.log(`Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return queryCache.getStats();
};

module.exports = {
  optimizedPatientSearch,
  optimizedPatientFilter,
  optimizedAnalyticsQuery,
  processBatch,
  clearCache,
  getCacheStats,
  queryCache
};