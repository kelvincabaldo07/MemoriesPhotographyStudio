"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface DataPoint {
  month: string;
  revenue: number;
  fullDate?: string;
}

interface RevenueLineChartProps {
  data: DataPoint[];
  height?: number;
  showGrid?: boolean;
  strokeColor?: string;
  fillColor?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: DataPoint;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {data.payload.fullDate || label}
        </p>
        <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
          ₱{data.value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export const RevenueLineChart: React.FC<RevenueLineChartProps> = ({
  data,
  height = 300,
  showGrid = true,
  strokeColor = "#10b981",
  fillColor = "#10b981",
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No revenue data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={fillColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="dark:stroke-gray-700"
            vertical={false}
          />
        )}
        
        <XAxis
          dataKey="month"
          tick={{ fill: "#6b7280", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
          className="dark:stroke-gray-700"
        />
        
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
          className="dark:stroke-gray-700"
          tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
        />
        
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: "5 5" }} />
        
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={strokeColor}
          strokeWidth={3}
          fill="url(#revenueGradient)"
          activeDot={{
            r: 6,
            fill: strokeColor,
            stroke: "#fff",
            strokeWidth: 2,
          }}
          dot={{
            r: 4,
            fill: strokeColor,
            stroke: "#fff",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueLineChart;
