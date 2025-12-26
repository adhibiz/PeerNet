import React from 'react';
import { FaBrain, FaLightbulb, FaArrowUp } from 'react-icons/fa';

const AIInsightsPanel = () => {
    return (
        <div className="space-y-4">
            <div className="p-4 border border-purple-200 bg-purple-50 rounded-xl">
                <div className="flex items-start">
                    <FaBrain className="text-xl text-purple-600 mt-1 mr-3" />
                    <div>
                        <h4 className="font-bold text-purple-900">Anomaly Detection</h4>
                        <p className="text-sm text-purple-700 mt-1">
                            Unusual spike in user registrations detected from region: APAC.
                            Verifying authenticity of 50+ accounts.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-xl">
                <div className="flex items-start">
                    <FaLightbulb className="text-xl text-yellow-600 mt-1 mr-3" />
                    <div>
                        <h4 className="font-bold text-yellow-900">Optimization Tip</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                            Session latency is increasing during 2 PM - 4 PM EST.
                            Suggest scaling up media servers or enabling region-based routing.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 border border-green-200 bg-green-50 rounded-xl">
                <div className="flex items-start">
                    <FaArrowUp className="text-xl text-green-600 mt-1 mr-3" />
                    <div>
                        <h4 className="font-bold text-green-900">Growth Opportunity</h4>
                        <p className="text-sm text-green-700 mt-1">
                            "React Advanced Patterns" topic has 40% higher retention.
                            Recommend creating more content in this category.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIInsightsPanel;
