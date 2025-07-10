import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Database, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Users,
  Phone,
  Building
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiBaseUrl } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import FileUploadZone from "../components/data/FileUploadZone";
import DataPreview from "../components/data/DataPreview";
import UploadProgress from "../components/data/UploadProgress";

const DATA_TYPES = [
  {
    id: "membership",
    title: "Membership Data",
    description: "Customer demographics, segments, and enrollment information",
    icon: Users,
    color: "blue",
    fields: ["Date", "Age Range", "Gender", "Segment", "Product", "Total Customers", "Region", "Language"]
  },
  {
    id: "calls", 
    title: "Call Volume Data",
    description: "Call types, volumes, duration, and resolution rates",
    icon: Phone,
    color: "indigo",
    fields: ["Date", "Call Type", "Total Calls", "Avg Duration", "Resolution Rate"]
  },
  {
    id: "headcount",
    title: "Staffing Data", 
    description: "Headcount, roles, and capacity information",
    icon: Building,
    color: "emerald",
    fields: ["Date", "Total Staff", "Customer Service %", "Supervisors %", "Tech Support %"]
  }
];

export default function DataManagement() {
  const [selectedDataType, setSelectedDataType] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = async (dataType, files) => {
    setSelectedDataType(dataType);
    setError(null);
    
    // Start upload progress
    setUploadProgress({ [dataType]: 0 });
    
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('dataType', dataType);
      
      // Update progress to show processing
      setUploadProgress({ [dataType]: 25 });
      
      // Use shared API URL function
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/data-management/upload`, {
        method: 'POST',
        body: formData,
      });
      
      // Update progress
      setUploadProgress({ [dataType]: 75 });
      
      const result = await response.json();
      
      if (result.success) {
        // Complete progress
        setUploadProgress({ [dataType]: 100 });
        
        // After a brief delay, mark as uploaded
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[dataType];
            return newProgress;
          });
          
          setUploadedFiles(prev => ({
            ...prev,
            [dataType]: { 
              fileName: files[0].name, 
              uploadDate: new Date(),
              recordsImported: result.data.imported
            }
          }));
        }, 1000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Failed to upload ${dataType} data: ${error.message}`);
      
      // Clear progress on error
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[dataType];
        return newProgress;
      });
    }
  };

  const getDataTypeColor = (color) => {
    const colors = {
      blue: "from-blue-500 to-blue-600",
      indigo: "from-indigo-500 to-indigo-600", 
      emerald: "from-emerald-500 to-emerald-600"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Data Management Hub
          </h1>
          <p className="text-slate-600 text-lg">
            Upload and manage your workforce analytics data sources
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Database className="w-3 h-3 mr-1" />
            3 Data Sources
          </Badge>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Data Source Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {DATA_TYPES.map((dataType) => {
          const isUploaded = uploadedFiles[dataType.id];
          const progress = uploadProgress[dataType.id];
          
          return (
            <Card key={dataType.id} className="glass-card border-none shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${getDataTypeColor(dataType.color)} shadow-lg`}>
                    <dataType.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  {isUploaded && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                </div>
                
                <CardTitle className="text-xl text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                  {dataType.title}
                </CardTitle>
                <p className="text-slate-600 text-sm">{dataType.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Tabs defaultValue="actual" className="w-full">
                  <TabsList className="mb-2">
                    <TabsTrigger value="actual">{dataType.title}</TabsTrigger>
                    <TabsTrigger value="forecast">{dataType.title.replace('Data', ' Forecast Data')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="actual">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Expected Fields:</p>
                      <div className="flex flex-wrap gap-1">
                        {dataType.fields.map((field) => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {progress !== undefined ? (
                      <UploadProgress progress={progress} fileName="Processing..." />
                    ) : isUploaded ? (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-800 font-medium">{isUploaded.fileName}</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Uploaded {isUploaded.uploadDate.toLocaleDateString()}
                          {isUploaded.recordsImported && ` • ${isUploaded.recordsImported} records imported`}
                        </p>
                      </div>
                    ) : (
                      <FileUploadZone
                        onFileSelect={(files) => handleFileSelect(dataType.id, files)}
                        dataType={dataType}
                      />
                    )}
                  </TabsContent>
                  <TabsContent value="forecast">
                    <div className="flex flex-col items-center justify-center min-h-[120px] text-center text-slate-500">
                      <FileText className="w-8 h-8 mb-2 text-blue-400" />
                      <div className="font-semibold text-slate-700 mb-1">{dataType.title.replace('Data', ' Forecast Data')}</div>
                      <div className="text-sm">Forecast data upload coming soon.<br/>You will be able to upload forecast CSV files here.</div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload Instructions */}
      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <FileText className="w-5 h-5 text-blue-600" />
            Upload Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">File Requirements</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  CSV or Excel format (.csv, .xlsx)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  Maximum file size: 50MB
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  First row should contain column headers
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  Date format: YYYY-MM-DD
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Data Quality Tips</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Ensure consistent data formatting
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Remove any empty rows or columns
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Validate numerical values
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Use standard category names
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}