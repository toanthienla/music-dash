import React from "react";


const mockData = [
  {
    id: 1,
    title: "Total devices",
    value: "10,000",
    
  },
  {
    id: 2,
    title: "Total Online devices",
    value: "9,000",
    
  },
  {
    id: 3,
    title: "Total Offline devices",
    value: "500",
    
  },
  {
    id: 4,
    title: "Total disconnected time",
    value: "500",
    
  },
];

const AnalyticsMetrics: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
      {/* <!-- Metric Item Start --> */}
      {mockData.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <p className="text-gray-500 text-theme-sm dark:text-gray-400">
            {item.title}
          </p>
          <div className="flex items-end justify-between mt-3">
            <div>
              <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                {item.value}
              </h4>
            </div>
           
          </div>
        </div>
      ))}

      {/* <!-- Metric Item End --> */}
    </div>
  );
};

export default AnalyticsMetrics;
