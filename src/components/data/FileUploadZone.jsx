import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";

export default function FileUploadZone({ onFileSelect, dataType }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFileSelect(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
          <Upload className="w-6 h-6 text-slate-500" />
        </div>
        
        <div>
          <p className="text-sm font-medium text-slate-700">
            Click to upload {dataType.title.toLowerCase()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            CSV or Excel files only
          </p>
        </div>
        
        <Button variant="outline" size="sm" className="mt-2">
          <FileText className="w-4 h-4 mr-2" />
          Browse Files
        </Button>
      </div>
    </div>
  );
}