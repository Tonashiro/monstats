import * as React from "react";
import { Button } from "@/components/atoms/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card";
import { RefreshCw, TrendingUp, Clock } from "lucide-react";

export interface AdminPanelProps {
  totalUsers?: number;
  lastUpdated?: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  totalUsers = 0,
  lastUpdated,
}) => {
  const [isRecalculating, setIsRecalculating] = React.useState(false);
  const [lastRecalculation, setLastRecalculation] = React.useState<
    string | null
  >(null);

  const handleRecalculateRankings = async () => {
    setIsRecalculating(true);
    try {
      const response = await fetch("/api/recalculate-rankings", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        setLastRecalculation(new Date().toISOString());
        console.log("Rankings recalculated:", result);
      } else {
        console.error("Failed to recalculate rankings");
      }
    } catch (error) {
      console.error("Error recalculating rankings:", error);
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <Card className="border-purple-500/20 bg-purple-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-400">
          <TrendingUp className="h-5 w-5" />
          Admin Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {totalUsers.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : "N/A"}
            </div>
            <div className="text-sm text-muted-foreground">Last Updated</div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={handleRecalculateRankings}
            disabled={isRecalculating}
            className="w-full"
          >
            {isRecalculating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Recalculating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate Rankings
              </>
            )}
          </Button>

          {lastRecalculation && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Last recalculated:{" "}
                {new Date(lastRecalculation).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Rankings are calculated based on weighted metrics</p>
          <p>
            • Volume and gas spent use log transformation to prevent whale
            dominance
          </p>
          <p>• Day 1 users get a 5% bonus</p>
        </div>
      </CardContent>
    </Card>
  );
};
