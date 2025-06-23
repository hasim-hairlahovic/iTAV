import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, ArrowUpDown, Filter as FilterIcon } from 'lucide-react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Function to convert array of objects to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => JSON.stringify(row[header])).join(',')
    )
  ];
  return csvRows.join('\\n');
};

// Function to download CSV
const downloadCSV = (csvString, filename) => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default function ReportDataTable({ data, dataName }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const headers = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).filter(header => header !== 'id' && header !== 'created_date' && header !== 'updated_date' && header !== 'created_by');
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    if (!data) return [];
    let CodedData = [...data];

    // Filter
    if (searchTerm) {
      CodedData = CodedData.filter(item =>
        headers.some(header =>
          String(item[header]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort
    if (sortConfig.key) {
      CodedData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return CodedData;
  }, [data, searchTerm, sortConfig, headers]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    const csvData = convertToCSV(filteredAndSortedData);
    downloadCSV(csvData, `${dataName.replace(/\s+/g, '_')}_Report_${new Date().toISOString().slice(0,10)}.csv`);
  };
  
  if (!data || data.length === 0) {
    return <p className="text-slate-500 text-center py-8">No data available for this report.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Input
          placeholder="Filter data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-white"
        />
        <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>
      <ScrollArea className="whitespace-nowrap rounded-md border bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} onClick={() => requestSort(header)} className="cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-1">
                    {header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {sortConfig.key === header && (
                      <ArrowUpDown className={`w-3 h-3 ${sortConfig.direction === 'ascending' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((row, rowIndex) => (
              <TableRow key={row.id || rowIndex}>
                {headers.map((header) => (
                  <TableCell key={header} className="text-sm text-slate-700">
                    {String(row[header])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <p className="text-xs text-slate-500 text-center">Showing {filteredAndSortedData.length} of {data.length} records.</p>
    </div>
  );
}