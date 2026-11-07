import React, { useState } from 'react';

interface SeverityData {
  severity: string;
  count: number;
  color: string;
}

interface SeverityDonutChartProps {
  data: SeverityData[];
  total: number;
}

export const SeverityDonutChart: React.FC<SeverityDonutChartProps> = ({ data, total }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
      {/* Donut graphic */}
      <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          {total === 0 ? (
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
          ) : (
            data.map((item, index) => {
              const percent = total > 0 ? (item.count / total) * 100 : 0;
              const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += percent;

              const isHovered = hoveredIndex === index;

              return (
                <circle
                  key={item.severity}
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            {hoveredIndex !== null ? data[hoveredIndex].count : total}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">
            {hoveredIndex !== null ? data[hoveredIndex].severity : 'Findings'}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full space-y-2">
        {data.map((item, index) => {
          const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={item.severity}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                isHovered ? 'bg-slate-100/80 font-bold' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-slate-700">{item.severity}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">{item.count}</span>
                <span className="text-slate-500 w-9 text-right font-mono">({percent}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

