export const analyticsService = {
    getAdvancedAnalytics: async (timeRange: string) => {
        // Mock data
        return {
            userGrowth: [
                { date: '2023-01-01', newUsers: 10, activeUsers: 100 },
                { date: '2023-01-02', newUsers: 15, activeUsers: 110 },
                { date: '2023-01-03', newUsers: 8, activeUsers: 115 },
                { date: '2023-01-04', newUsers: 20, activeUsers: 130 },
                { date: '2023-01-05', newUsers: 12, activeUsers: 140 },
            ],
            sessionMetrics: [],
            geographicDistribution: [
                { country: 'USA', users: 500, sessions: 1200 },
                { country: 'India', users: 450, sessions: 1100 },
                { country: 'UK', users: 200, sessions: 400 },
            ],
            deviceUsage: [
                { device: 'Desktop', percentage: 60, color: '#0088FE' },
                { device: 'Mobile', percentage: 30, color: '#00C49F' },
                { device: 'Tablet', percentage: 10, color: '#FFBB28' },
            ],
            retention: [
                { cohort: 'Jan 1', day1: 100, day7: 80, day30: 60 },
                { cohort: 'Jan 8', day1: 100, day7: 75, day30: 55 },
            ],
            revenue: [],
            learningPatterns: [],
            topTopics: [
                { topic: 'React', sessions: 150, satisfaction: 95 },
                { topic: 'Node.js', sessions: 120, satisfaction: 88 },
                { topic: 'Design', sessions: 90, satisfaction: 92 },
            ]
        };
    }
};
