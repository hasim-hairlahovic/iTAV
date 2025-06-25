import React, { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Filter } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { AlertTriangle } from "lucide-react";

const CALL_TYPES = ["All", "Customer Service", "Grievance", "Tele-sales", "Enrollment", "Billing"];

export default function CallMetricsTable({ callData }) {
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [filterCallType, setFilterCallType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30), []);

  const processedData = useMemo(() => {
    if (!callData || callData.length === 0) return [];

    return callData
      .map(item => ({
        ...item,
        dateISO: parseISO(item.date),
        dateFormatted: format(parseISO(item.date), "MMM d, yyyy"),
        avg_call_duration_formatted: `${Number.isFinite(Number(item.avg_call_duration)) ? Number(item.avg_call_duration).toFixed(2) : '-'} min`,
        resolution_rate_formatted: `${Number.isFinite(Number(item.resolution_rate)) ? Number(item.resolution_rate).toFixed(2) : '-'}%`
      }))
      .filter(item => item.dateISO >= thirtyDaysAgo) // Filter for last 30 days
      .filter(item => filterCallType === "All" || item.call_type === filterCallType)
      .filter(item => 
        item.call_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.dateFormatted.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === 'date') {
          valA = a.dateISO;
          valB = b.dateISO;
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
  }, [callData, sortConfig, filterCallType, searchTerm, thirtyDaysAgo]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ columnKey, label }) => (
    <TableHead onClick={() => requestSort(columnKey)} className="cursor-pointer hover:bg-slate-50">
      <div className="flex items-center gap-1">
        {label}
        {sortConfig.key === columnKey && (
          <ArrowUpDown className={`w-3 h-3 ${sortConfig.direction === 'ascending' ? 'transform rotate-180' : ''}`} />
        )}
      </div>
    </TableHead>
  );

  if (!callData || callData.length === 0) {
     return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <AlertTriangle className="w-12 h-12 mb-4 text-amber-500" />
        <p className="text-lg font-semibold">No call data available for the last 30 days.</p>
        <p>Please upload data on the Data Management page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Input 
          placeholder="Search by call type or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-white"
        />
        <Select value={filterCallType} onValueChange={setFilterCallType}>
          <SelectTrigger className="w-full md:w-[200px] bg-white">
            <Filter className="w-4 h-4 mr-2 text-slate-500" />
            <SelectValue placeholder="Filter by Call Type" />
          </SelectTrigger>
          <SelectContent>
            {CALL_TYPES.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="rounded-lg border overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <SortableHeader columnKey="date" label="Date" />
              <SortableHeader columnKey="call_type" label="Call Type" />
              <SortableHeader columnKey="total_calls" label="Total Calls" />
              <SortableHeader columnKey="avg_call_duration" label="Avg. Duration" />
              <SortableHeader columnKey="resolution_rate" label="Resolution Rate" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.length > 0 ? (
              processedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.dateFormatted}</TableCell>
                  <TableCell>{item.call_type}</TableCell>
                  <TableCell>{item.total_calls.toLocaleString()}</TableCell>
                  <TableCell>{item.avg_call_duration_formatted}</TableCell>
                  <TableCell>{item.resolution_rate_formatted}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No data matches your current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}