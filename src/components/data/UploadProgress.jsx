import React from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export default function UploadProgress({ progress, fileName }) {
  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-3 mb-3">
        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        <span className="text-sm font-medium text-blue-800">
          Processing {fileName}
        </span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="flex justify-between items-center mt-2 text-xs text-blue-600">
        <span>Uploading and validating data...</span>
        <span>{progress}%</span>
      </div>
    </div>
  );
}