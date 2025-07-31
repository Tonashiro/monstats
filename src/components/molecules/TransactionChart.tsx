import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { TransactionDataPoint } from "@/types";
import { TrendingUp, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatMON } from "@/lib/utils";
import { ChartSkeleton } from "@/components/atoms/Skeleton";

/**
 * Time period options for the chart
 */
type TimePeriod = "30D" | "3M" | "ALL";

/**
 * TransactionChart component props interface
 */
export interface TransactionChartProps {
  /** Transaction history data */
  data: TransactionDataPoint[];
  /** Whether the chart is loading */
  isLoading?: boolean;
}

/**
 * Transaction chart component with time period selection
 * @param data - Transaction history data
 * @param isLoading - Whether the chart is loading
 * @returns TransactionChart component
 */
export const TransactionChart: React.FC<TransactionChartProps> = ({
  data,
  isLoading = false,
}) => {
  const [timePeriod, setTimePeriod] = React.useState<TimePeriod>("30D");

  // Group data by weeks
  const groupByWeeks = React.useCallback((data: TransactionDataPoint[]) => {
    const weeklyData = new Map<
      string,
      { transactions: number; volume: number; gasSpent: number; count: number }
    >();

    data.forEach((item) => {
      const date = new Date(item.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split("T")[0];

      if (weeklyData.has(weekKey)) {
        const existing = weeklyData.get(weekKey)!;
        existing.transactions += item.transactions;
        existing.volume += item.volume;
        existing.gasSpent += item.gasSpent;
        existing.count += 1;
      } else {
        weeklyData.set(weekKey, {
          transactions: item.transactions,
          volume: item.volume,
          gasSpent: item.gasSpent,
          count: 1,
        });
      }
    });

    // Get the date range and fill in missing weeks
    const weeks = Array.from(weeklyData.keys()).sort();
    if (weeks.length === 0) return [];

    const startWeek = new Date(weeks[0]);
    const endWeek = new Date(weeks[weeks.length - 1]);

    const completeWeeks: (TransactionDataPoint & { label: string })[] = [];
    const currentWeek = new Date(startWeek);

    while (currentWeek <= endWeek) {
      const weekKey = currentWeek.toISOString().split("T")[0];
      const existingData = weeklyData.get(weekKey);

      completeWeeks.push({
        date: weekKey,
        transactions: existingData?.transactions || 0,
        volume: existingData?.volume || 0,
        gasSpent: existingData?.gasSpent || 0,
        label: `Week of ${currentWeek.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`,
      });

      // Move to next week
      currentWeek.setDate(currentWeek.getDate() + 7);
    }

    return completeWeeks;
  }, []);

  // Process data based on selected time period
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let cutoffDate: Date;
    let endDate: Date;

    switch (timePeriod) {
      case "30D":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "3M":
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "ALL":
        // For ALL, use the actual data range but ensure we start from launch date
        const launchDate = new Date("2025-02-19T00:00:00Z");
        cutoffDate = launchDate;
        endDate = now;
        break;
      default:
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    // Filter data based on time period
    const filteredData = data.filter(
      (item) =>
        new Date(item.date) >= cutoffDate && new Date(item.date) <= endDate
    );

    if (timePeriod === "3M") {
      // Group by weeks for 3 months view
      return groupByWeeks(filteredData);
    } else if (timePeriod === "ALL") {
      // Group by months for all-time view - ensure we include all months from launch to now
      const launchDate = new Date("2025-02-19T00:00:00Z");
      const startMonth = new Date(
        launchDate.getFullYear(),
        launchDate.getMonth(),
        1
      );
      const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const completeMonths: (TransactionDataPoint & { label: string })[] = [];
      const currentMonth = new Date(startMonth);

      while (currentMonth <= endMonth) {
        const monthKey = `${currentMonth.getFullYear()}-${String(
          currentMonth.getMonth() + 1
        ).padStart(2, "0")}`;

        // Find data for this month
        const monthData = filteredData.filter((item) => {
          const itemDate = new Date(item.date);
          return (
            itemDate.getFullYear() === currentMonth.getFullYear() &&
            itemDate.getMonth() === currentMonth.getMonth()
          );
        });

        // Sum up the data for this month
        const monthTransactions = monthData.reduce(
          (sum, item) => sum + item.transactions,
          0
        );
        const monthVolume = monthData.reduce(
          (sum, item) => sum + item.volume,
          0
        );
        const monthGasSpent = monthData.reduce(
          (sum, item) => sum + item.gasSpent,
          0
        );

        completeMonths.push({
          date: monthKey,
          transactions: monthTransactions,
          volume: monthVolume,
          gasSpent: monthGasSpent,
          label: currentMonth.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
          }),
        });

        // Move to next month
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }

      return completeMonths;
    } else {
      // Daily data for 30D view - fill in missing days with zeros
      const completeData: (TransactionDataPoint & { label: string })[] = [];
      const currentDate = new Date(cutoffDate);

      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split("T")[0];
        const existingData = filteredData.find(
          (item) => item.date === dateString
        );

        completeData.push({
          ...existingData,
          date: dateString,
          transactions: existingData?.transactions || 0,
          volume: existingData?.volume || 0,
          gasSpent: existingData?.gasSpent || 0,
          label: currentDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        });

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return completeData;
    }
  }, [data, timePeriod, groupByWeeks]);

  const getChartTitle = () => {
    switch (timePeriod) {
      case "30D":
        return "Transaction Activity (Last 30 Days)";
      case "3M":
        return "Transaction Activity (Last 3 Months)";
      case "ALL":
        return "Transaction Activity (All Time)";
      default:
        return "Transaction Activity";
    }
  };

  const getXAxisDataKey = () => {
    switch (timePeriod) {
      case "30D":
        return "label";
      case "3M":
        return "label";
      case "ALL":
        return "label";
      default:
        return "date";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <ChartSkeleton />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Transaction Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No transaction data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {getChartTitle()}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex rounded-md border">
              {(["30D", "3M", "ALL"] as TimePeriod[]).map((period) => (
                <Button
                  key={period}
                  variant={timePeriod === period ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimePeriod(period)}
                  className="rounded-none first:rounded-l-md last:rounded-r-md"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={getXAxisDataKey()}
                tick={{ fontSize: 12 }}
                angle={timePeriod === "ALL" ? -45 : 0}
                textAnchor={timePeriod === "ALL" ? "end" : "middle"}
                height={timePeriod === "ALL" ? 60 : 30}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: "Transactions",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [
                  name === "transactions" ? value : formatMON(value),
                  name === "transactions"
                    ? "Transactions"
                    : name === "volume"
                    ? "Volume (MON)"
                    : "Gas Spent (MON)",
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="transactions"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2 }}
                name="transactions"
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                name="volume"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
