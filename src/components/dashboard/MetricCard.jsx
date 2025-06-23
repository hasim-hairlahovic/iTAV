import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function MetricCard({ title, value, change, icon: Icon, gradient }) {
  const isPositive = change >= 0;
  
  return (
    <Card className="glass-card border-none shadow-xl hover:shadow-2xl transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-1 text-sm">
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )}
            <span className={`font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
            {value}
          </p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {isPositive ? 'Increased' : 'Decreased'} from last month
          </p>
        </div>
      </CardContent>
    </Card>
  );
}