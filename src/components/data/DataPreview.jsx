import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

export default function DataPreview({ data, dataType }) {
  if (!data || !data.length) return null;

  const headers = Object.keys(data[0]);
  const previewRows = data.slice(0, 5);

  return (
    <Card className="glass-card border-none shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Eye className="w-5 h-5 text-blue-600" />
          Data Preview - {dataType.title}
          <Badge className="ml-2 bg-blue-100 text-blue-800">
            {data.length} records
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="font-semibold">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, index) => (
                <TableRow key={index}>
                  {headers.map((header) => (
                    <TableCell key={header} className="text-sm">
                      {row[header]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {data.length > 5 && (
          <p className="text-sm text-slate-500 mt-4 text-center">
            Showing first 5 of {data.length} records
          </p>
        )}
      </CardContent>
    </Card>
  );
}