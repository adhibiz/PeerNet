export const systemService = {
    getSystemMetrics: async () => {
        return {
            cpu: {
                usage: 45.2,
                cores: 8,
                loadAverage: [1.2, 1.5, 1.1]
            },
            memory: {
                total: 16 * 1024 * 1024 * 1024,
                used: 8 * 1024 * 1024 * 1024,
                free: 8 * 1024 * 1024 * 1024,
                usage: 50,
                swapUsed: 0,
                swapTotal: 4 * 1024 * 1024 * 1024
            },
            disk: {
                total: 512 * 1024 * 1024 * 1024,
                used: 200 * 1024 * 1024 * 1024,
                free: 312 * 1024 * 1024 * 1024,
                usage: 39,
                readSpeed: 100,
                writeSpeed: 50
            },
            network: {
                interfaces: [],
                connections: 1200,
                latency: 25
            },
            services: [
                { name: 'API', status: 'running', uptime: 100000, memory: 500, cpu: 10 },
                { name: 'Database', status: 'running', uptime: 200000, memory: 2000, cpu: 20 },
            ],
            uptime: 500000,
            processes: 123,
            alerts: []
        };
    }
};
