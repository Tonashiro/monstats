import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card";
import { TrendingUp } from "lucide-react";

export const AdminPanel: React.FC = () => {
  return (
    <Card className="border-purple-500/20 bg-purple-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-400">
          <TrendingUp className="h-5 w-5" />
          Ranking System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
