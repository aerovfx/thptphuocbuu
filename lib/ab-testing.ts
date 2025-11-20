/**
 * A/B Testing Framework cho News Feed
 * 
 * Features:
 * - Experiment management
 * - User assignment (consistent hashing)
 * - Metrics tracking
 * - Statistical significance testing
 */

interface Experiment {
  id: string
  name: string
  variants: Variant[]
  trafficSplit: number // Percentage of users to include (0-100)
  startDate: Date
  endDate?: Date
  active: boolean
}

interface Variant {
  id: string
  name: string
  weight: number // Percentage of experiment traffic (0-100)
  config: Record<string, any>
}

interface ExperimentAssignment {
  userId: string
  experimentId: string
  variantId: string
  assignedAt: Date
}

interface ExperimentMetrics {
  experimentId: string
  variantId: string
  metric: string
  value: number
  timestamp: Date
}

// In-memory experiment store (in production, use database)
const experiments: Map<string, Experiment> = new Map()
const assignments: Map<string, ExperimentAssignment> = new Map()
const metrics: ExperimentMetrics[] = []

/**
 * Create a new A/B test experiment
 */
export function createExperiment(
  id: string,
  name: string,
  variants: Variant[],
  trafficSplit: number = 100,
  startDate: Date = new Date(),
  endDate?: Date
): Experiment {
  // Validate weights sum to 100
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0)
  if (totalWeight !== 100) {
    throw new Error('Variant weights must sum to 100')
  }

  const experiment: Experiment = {
    id,
    name,
    variants,
    trafficSplit,
    startDate,
    endDate,
    active: true,
  }

  experiments.set(id, experiment)
  return experiment
}

/**
 * Assign user to experiment variant (consistent hashing)
 */
export function assignToExperiment(
  userId: string,
  experimentId: string
): string | null {
  const experiment = experiments.get(experimentId)

  if (!experiment || !experiment.active) {
    return null
  }

  // Check if experiment is still running
  const now = new Date()
  if (now < experiment.startDate) {
    return null
  }

  if (experiment.endDate && now > experiment.endDate) {
    experiment.active = false
    return null
  }

  // Check if user already assigned
  const assignmentKey = `${userId}:${experimentId}`
  const existingAssignment = assignments.get(assignmentKey)
  if (existingAssignment) {
    return existingAssignment.variantId
  }

  // Consistent hashing based on userId + experimentId
  const hash = hashString(userId + experimentId)
  const trafficHash = hash % 100

  // Check if user is in traffic split
  if (trafficHash >= experiment.trafficSplit) {
    return null // User not in experiment
  }

  // Assign to variant based on hash
  const variantHash = hash % 100
  let cumulativeWeight = 0
  let selectedVariant: Variant | null = null

  for (const variant of experiment.variants) {
    cumulativeWeight += variant.weight
    if (variantHash < cumulativeWeight) {
      selectedVariant = variant
      break
    }
  }

  if (!selectedVariant) {
    selectedVariant = experiment.variants[experiment.variants.length - 1]
  }

  // Store assignment
  const assignment: ExperimentAssignment = {
    userId,
    experimentId,
    variantId: selectedVariant.id,
    assignedAt: new Date(),
  }

  assignments.set(assignmentKey, assignment)

  return selectedVariant.id
}

/**
 * Get user's variant assignment
 */
export function getUserVariant(
  userId: string,
  experimentId: string
): string | null {
  const assignmentKey = `${userId}:${experimentId}`
  const assignment = assignments.get(assignmentKey)
  return assignment ? assignment.variantId : null
}

/**
 * Track experiment metric
 */
export function trackMetric(
  userId: string,
  experimentId: string,
  metric: string,
  value: number
): void {
  const variantId = getUserVariant(userId, experimentId)
  if (!variantId) return

  const metricEntry: ExperimentMetrics = {
    experimentId,
    variantId,
    metric,
    value,
    timestamp: new Date(),
  }

  metrics.push(metricEntry)
}

/**
 * Get experiment results
 */
export function getExperimentResults(experimentId: string): {
  variants: Record<
    string,
    {
      name: string
      metrics: Record<string, { sum: number; count: number; avg: number }>
    }
  >
} {
  const experiment = experiments.get(experimentId)
  if (!experiment) {
    throw new Error('Experiment not found')
  }

  const variantMetrics: Record<
    string,
    {
      name: string
      metrics: Record<string, { sum: number; count: number; avg: number }>
    }
  > = {}

  // Initialize variant structures
  for (const variant of experiment.variants) {
    variantMetrics[variant.id] = {
      name: variant.name,
      metrics: {},
    }
  }

  // Aggregate metrics
  for (const metric of metrics) {
    if (metric.experimentId !== experimentId) continue

    if (!variantMetrics[metric.variantId].metrics[metric.metric]) {
      variantMetrics[metric.variantId].metrics[metric.metric] = {
        sum: 0,
        count: 0,
        avg: 0,
      }
    }

    const metricData = variantMetrics[metric.variantId].metrics[metric.metric]
    metricData.sum += metric.value
    metricData.count += 1
    metricData.avg = metricData.sum / metricData.count
  }

  return { variants: variantMetrics }
}

/**
 * Calculate statistical significance (t-test)
 */
export function calculateSignificance(
  experimentId: string,
  metric: string,
  variantA: string,
  variantB: string
): {
  significant: boolean
  pValue: number
  confidence: number
} {
  const results = getExperimentResults(experimentId)

  const variantAData = results.variants[variantA]?.metrics[metric]
  const variantBData = results.variants[variantB]?.metrics[metric]

  if (!variantAData || !variantBData) {
    return { significant: false, pValue: 1, confidence: 0 }
  }

  // Simplified t-test calculation
  const meanA = variantAData.avg
  const meanB = variantBData.avg
  const countA = variantAData.count
  const countB = variantBData.count

  // Calculate pooled standard deviation
  const varianceA = calculateVariance(
    experimentId,
    metric,
    variantA,
    meanA
  )
  const varianceB = calculateVariance(
    experimentId,
    metric,
    variantB,
    meanB
  )

  const pooledStd = Math.sqrt(
    ((countA - 1) * varianceA + (countB - 1) * varianceB) /
      (countA + countB - 2)
  )

  const stdError = pooledStd * Math.sqrt(1 / countA + 1 / countB)
  const tStatistic = (meanA - meanB) / stdError

  // Simplified p-value calculation (for large samples, use normal distribution)
  const degreesOfFreedom = countA + countB - 2
  const pValue = 2 * (1 - normalCDF(Math.abs(tStatistic)))

  // 95% confidence level
  const significant = pValue < 0.05
  const confidence = (1 - pValue) * 100

  return { significant, pValue, confidence }
}

/**
 * Helper: Calculate variance
 */
function calculateVariance(
  experimentId: string,
  metric: string,
  variantId: string,
  mean: number
): number {
  const variantMetrics = metrics.filter(
    (m) =>
      m.experimentId === experimentId &&
      m.variantId === variantId &&
      m.metric === metric
  )

  if (variantMetrics.length === 0) return 0

  const sumSquaredDiff = variantMetrics.reduce(
    (sum, m) => sum + Math.pow(m.value - mean, 2),
    0
  )

  return sumSquaredDiff / variantMetrics.length
}

/**
 * Helper: Hash string to number
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Helper: Normal CDF approximation
 */
function normalCDF(x: number): number {
  // Approximation using error function
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

/**
 * Helper: Error function approximation
 */
function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)

  const t = 1.0 / (1.0 + p * x)
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}

/**
 * Predefined experiments for feed ranking
 */
export const FEED_EXPERIMENTS = {
  FRESHNESS_WEIGHT: 'feed_freshness_weight',
  DIVERSITY_LAMBDA: 'feed_diversity_lambda',
  CANDIDATE_POOL_SIZE: 'feed_candidate_pool_size',
  RANKING_MODEL: 'feed_ranking_model',
}

/**
 * Initialize default experiments
 */
export function initializeDefaultExperiments() {
  // Experiment 1: Freshness weight variation
  createExperiment(
    FEED_EXPERIMENTS.FRESHNESS_WEIGHT,
    'Freshness Weight Variation',
    [
      { id: 'control', name: 'Control (0.2)', weight: 50, config: { freshnessWeight: 0.2 } },
      { id: 'treatment', name: 'Treatment (0.3)', weight: 50, config: { freshnessWeight: 0.3 } },
    ],
    10 // 10% of users
  )

  // Experiment 2: Diversity lambda
  createExperiment(
    FEED_EXPERIMENTS.DIVERSITY_LAMBDA,
    'Diversity Lambda Tuning',
    [
      { id: 'control', name: 'Control (0.7)', weight: 50, config: { diversityLambda: 0.7 } },
      { id: 'treatment', name: 'Treatment (0.8)', weight: 50, config: { diversityLambda: 0.8 } },
    ],
    10
  )

  // Experiment 3: Candidate pool size
  createExperiment(
    FEED_EXPERIMENTS.CANDIDATE_POOL_SIZE,
    'Candidate Pool Size',
    [
      { id: 'control', name: 'Control (1000)', weight: 50, config: { poolSize: 1000 } },
      { id: 'treatment', name: 'Treatment (2000)', weight: 50, config: { poolSize: 2000 } },
    ],
    10
  )
}

// Initialize on module load
initializeDefaultExperiments()

