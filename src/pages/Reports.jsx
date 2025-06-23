import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, ListFilter, Loader2 } from "lucide-react";
import { MembershipData, CallData, HeadcountData } from "@/api/entities";
import ReportDataTable from "../components/reports/ReportDataTable";

const DATA_SOURCES = [
  { value: 'membership', label: 'Membership Data', entity: MembershipData },
  { value: 'calls', label: 'Call Data', entity: CallData },
  { value: 'headcount', label: 'Headcount Data', entity: HeadcountData },
];

export default function ReportsPage() {
  const [selectedDataSourceKey, setSelectedDataSourceKey] = useState(DATA_SOURCES[0].value);
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedDataSource = DATA_SOURCES.find(ds => ds.value === selectedDataSourceKey);

  const fetchReportData = async () => {
    if (!selectedDataSource) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await selectedDataSource.entity.list('-created_date', 0); // 0 for all records
      setReportData(data);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError(`Failed to load data for ${selectedDataSource.label}.`);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedDataSourceKey]);

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Data Reports & Exports
          </h1>
          <p className="text-slate-600 text-lg">
            Select a dataset to view and export.
          </p>
        </div>
      </div>

      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Dataset Viewer
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Select value={selectedDataSourceKey} onValueChange={setSelectedDataSourceKey}>
                <SelectTrigger className="w-full sm:w-[250px] bg-white">
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>
                <SelectContent>
                  {DATA_SOURCES.map(ds => (
                    <SelectItem key={ds.value} value={ds.value}>
                      {ds.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={fetchReportData} disabled={isLoading} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ListFilter className="w-4 h-4 mr-2" />}
                Load Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="ml-3 text-slate-600">Loading data for {selectedDataSource?.label}...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="text-red-600 bg-red-50 p-4 rounded-md text-center">
              {error}
            </div>
          )}
          {!isLoading && !error && (
            <ReportDataTable data={reportData} dataName={selectedDataSource?.label || 'Report'} />
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
            <CardTitle className="text-xl text-slate-800">Advanced Reporting Features</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-slate-600">
                More advanced reporting capabilities, including custom report generation, visual dashboards,
                and scheduled exports, are planned for future updates. Currently, you can view and export raw datasets.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}