"use client";

import { useState } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  MapPin,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Location {
  id: number;
  loca_code: string;
  loca_name: string;
}

export default function OpenStockPage() {
  const { toast } = useToast();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);

  const fetchLocations = async () => {
    try {
      setIsFetchingLocations(true);
      const { data: res } = await api.get("/locations");
      if (res.success) {
        setLocations(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    } finally {
      setIsFetchingLocations(false);
    }
  };

  useState(() => {
    fetchLocations();
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to import.",
        type: "error",
      });
      return;
    }

    if (!selectedLocation) {
      toast({
        title: "No location selected",
        description: "Please select a location for the opening stock.",
        type: "error",
      });
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("location", selectedLocation);

    try {
      // Assuming a backend endpoint for open stock import exists or will be created
      const { data: res } = await api.post(
        "/products/import-open-stock",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (res.success) {
        toast({
          title: "Import Successful",
          description:
            res.message || "Open stock records imported successfully.",
          type: "success",
        });
        setImportFile(null);
        // Reset file input
        const fileInput = document.getElementById(
          "open-stock-file",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        throw new Error(res.message);
      }
    } catch (error: any) {
      console.error("Import failed:", error);
      toast({
        title: "Import Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to import open stock.",
        type: "error",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsExporting(true);
      // Assuming a template export endpoint exists
      const response = await api.get("/products/export-open-stock-template", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "open_stock_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Template Downloaded",
        description: "Opening stock template has been downloaded.",
        type: "success",
      });
    } catch (error: any) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description: "Could not download the template. Please try again.",
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 py-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Open Stock Handling
        </h1>
        <p className="text-muted-foreground text-sm">
          Upload Excel records to initialize or update opening stock for
          products.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Import Records
            </CardTitle>
            <CardDescription>
              Select your Excel file (.xlsx or .xls) to upload opening stock
              data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="location-select">Location</Label>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger id="location-select" className="h-11">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.loca_code} value={loc.loca_code}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {loc.loca_name} ({loc.loca_code})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="open-stock-file">Excel File</Label>
              <Input
                id="open-stock-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handleImport}
              disabled={!importFile || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Import...
                </>
              ) : (
                "Start Import"
              )}
            </Button>

            <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Important Note:</p>
                  <ul className="list-disc list-inside space-y-1 opacity-90">
                    <li>Ensure Product Codes match existing records.</li>
                    <li>Quantities will be initialized as opening balances.</li>
                    <li>Avoid duplicate product codes in the same file.</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Download Template
            </CardTitle>
            <CardDescription>
              Don&apos;t have the format? Download our template to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border border-muted-foreground/10 space-y-4">
              <FileSpreadsheet className="h-16 w-16 text-muted-foreground/30" />
              <p className="text-sm text-center text-muted-foreground max-w-[200px]">
                Pre-formatted Excel sheet with all required columns.
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full mt-6 h-12 text-base"
              onClick={handleDownloadTemplate}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Download className="mr-2 h-5 w-5" />
              )}
              Download Template (.xlsx)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
