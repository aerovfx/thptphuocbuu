/**
 * User Interaction Scoring System
 * 
 * Calculates interaction scores based on 5 factors:
 * - Message Score (30%): Frequency and volume of messages
 * - Recency Score (25%): Time since last interaction
 * - Duration Score (20%): Length of conversations
 * - Type Score (15%): Diversity of interactions
 * - Mutual Score (10%): Balance of sent/received messages
 */

export interface UserInteractionData {
    userId: string
    totalMessages: number
    messagesLast7Days: number
    lastInteractionTime: Date | null
    daysSinceFirstInteraction: number
    avgConversationMinutes: number
    conversationCount: number
    longestConversationMinutes: number
    sentMessages: number
    receivedMessages: number
    textMessages: number
    reactions: number
    averageResponseTimeMinutes: number
    conversationsInitiated: number
}

export interface ScoreBreakdown {
    message: number
    recency: number
    duration: number
    type: number
    mutual: number
}

export interface InteractionScore {
    total: number
    breakdown: ScoreBreakdown
}

export interface RankedUser {
    userId: string
    score: InteractionScore
    isOnline?: boolean
}

export class InteractionScoreManager {
    private weights = {
        message: 0.30,
        recency: 0.25,
        duration: 0.20,
        type: 0.15,
        mutual: 0.10,
    }

    /**
     * Calculate Message Score (30% weight)
     * Based on total messages, frequency, and recent activity
     */
    calculateMessageScore(data: UserInteractionData): number {
        const { totalMessages, daysSinceFirstInteraction, messagesLast7Days } = data

        if (daysSinceFirstInteraction === 0) return 0

        const messageFrequency = totalMessages / daysSinceFirstInteraction

        // Base score from total messages (max 50 points)
        let score = Math.min(totalMessages / 10, 50)

        // Bonus for high frequency (messages/day)
        if (messageFrequency > 10) score += 20
        else if (messageFrequency > 5) score += 10
        else if (messageFrequency > 2) score += 5

        // Bonus for recent messages in last 7 days (max 30 points)
        score += Math.min(messagesLast7Days / 2, 30)

        return Math.min(score, 100)
    }

    /**
     * Calculate Recency Score (25% weight)
     * Prioritizes users with recent interactions
     */
    calculateRecencyScore(lastInteraction: Date | null): number {
        if (!lastInteraction) return 0

        const now = new Date()
        const hoursSince = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60)

        // Score decays over time
        if (hoursSince < 1) return 100        // < 1 hour: 100 points
        if (hoursSince < 6) return 90         // < 6 hours: 90 points
        if (hoursSince < 24) return 75        // < 1 day: 75 points
        if (hoursSince < 72) return 50        // < 3 days: 50 points
        if (hoursSince < 168) return 30       // < 1 week: 30 points
        if (hoursSince < 720) return 15       // < 1 month: 15 points

        return 5 // > 1 month: 5 points
    }

    /**
     * Calculate Duration Score (20% weight)
     * Based on conversation length and depth
     */
    calculateDurationScore(data: UserInteractionData): number {
        const { avgConversationMinutes, conversationCount, longestConversationMinutes } = data

        if (conversationCount === 0) return 0

        let score = 0

        // Points for average conversation length
        if (avgConversationMinutes > 30) score += 40
        else if (avgConversationMinutes > 15) score += 30
        else if (avgConversationMinutes > 5) score += 20
        else score += 10

        // Bonus for number of conversations (max 40 points)
        score += Math.min(conversationCount * 2, 40)

        // Bonus for longest conversation
        if (longestConversationMinutes > 60) score += 20
        else if (longestConversationMinutes > 30) score += 10

        return Math.min(score, 100)
    }

    /**
     * Calculate Type Score (15% weight)
     * Diversity of interaction types
     */
    calculateTypeScore(data: UserInteractionData): number {
        let score = 0

        // Text messages
        if (data.textMessages > 0) score += 20

        // Reactions & interactions
        if (data.reactions > 10) score += 15
        else if (data.reactions > 5) score += 10

        // For future: can add more types like voice calls, video, media sharing
        // Currently limited to what's available in Message model

        // Give partial score based on message volume
        if (data.totalMessages > 50) score += 20
        else if (data.totalMessages > 20) score += 15
        else if (data.totalMessages > 10) score += 10

        return Math.min(score, 100)
    }

    /**
     * Calculate Mutual Score (10% weight)
     * Balance of two-way interaction
     */
    calculateMutualScore(data: UserInteractionData): number {
        const { sentMessages, receivedMessages, conversationCount, averageResponseTimeMinutes, conversationsInitiated } = data

        if (conversationCount === 0) return 0

        const total = sentMessages + receivedMessages
        if (total === 0) return 0

        // Balance ratio (ideal: 50-50)
        const ratio = Math.min(sentMessages, receivedMessages) / (total / 2)
        let score = ratio * 50 // Max 50 points for balance

        // Bonus for quick responses
        if (averageResponseTimeMinutes < 5) score += 30
        else if (averageResponseTimeMinutes < 15) score += 20
        else if (averageResponseTimeMinutes < 60) score += 10

        // Bonus for balanced conversation initiation
        const initiationRate = conversationsInitiated / conversationCount
        if (initiationRate > 0.3 && initiationRate < 0.7) score += 20

        return Math.min(score, 100)
    }

    /**
     * Calculate total interaction score
     */
    calculateTotalScore(data: UserInteractionData): InteractionScore {
        const messageScore = this.calculateMessageScore(data)
        const recencyScore = this.calculateRecencyScore(data.lastInteractionTime)
        const durationScore = this.calculateDurationScore(data)
        const typeScore = this.calculateTypeScore(data)
        const mutualScore = this.calculateMutualScore(data)

        const totalScore =
            (messageScore * this.weights.message) +
            (recencyScore * this.weights.recency) +
            (durationScore * this.weights.duration) +
            (typeScore * this.weights.type) +
            (mutualScore * this.weights.mutual)

        return {
            total: Math.round(totalScore),
            breakdown: {
                message: Math.round(messageScore),
                recency: Math.round(recencyScore),
                duration: Math.round(durationScore),
                type: Math.round(typeScore),
                mutual: Math.round(mutualScore),
            },
        }
    }

    /**
     * Sort users by online status first, then by interaction score
     */
    sortUsersByInteraction(users: RankedUser[]): RankedUser[] {
        return users.sort((a, b) => {
            // Prioritize online users
            if (a.isOnline && !b.isOnline) return -1
            if (!a.isOnline && b.isOnline) return 1

            // Then sort by score
            return b.score.total - a.score.total
        })
    }

    /**
     * Get top N users by interaction score
     */
    getTopUsers(users: RankedUser[], n: number = 10): RankedUser[] {
        const sorted = this.sortUsersByInteraction(users)
        return sorted.slice(0, n)
    }

    /**
     * Get suggested users to interact with
     */
    getSuggestedUsers(users: RankedUser[], minScore: number = 30): RankedUser[] {
        return this.sortUsersByInteraction(users)
            .filter(u => u.score.total > minScore)
            .slice(0, 5)
    }
}

// Singleton instance
export const scoreManager = new InteractionScoreManager()
