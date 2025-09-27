"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { Upload, Loader2 } from "lucide-react";

export default function TestGCSSimplePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const testDirectUpload = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      // Test direct upload to GCS (without authentication)
      const bucketName = "mathvideostore";
      const fileName = `test-uploads/${Date.now()}-${file.name}`;
      const url = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      
      console.log("Attempting direct upload to:", url);
      
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      console.log("Upload response:", response.status, response.statusText);

      if (response.ok) {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        setResult(`✅ Upload successful! URL: ${publicUrl}`);
        toast.success("Direct upload successful!");
      } else {
        const errorText = await response.text();
        setResult(`❌ Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
        toast.error(`Upload failed: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setResult(`❌ Error: ${error.message}`);
      toast.error(`Upload error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testPresignedUpload = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      // 1. Get presigned URL (this will fail without auth)
      const presignedResponse = await fetch("/api/upload/gcs-presigned-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          uploadType: "attachment",
        }),
      });

      console.log("Presigned URL response:", presignedResponse.status);

      if (!presignedResponse.ok) {
        setResult(`❌ Presigned URL failed: ${presignedResponse.status} ${presignedResponse.statusText}\n\nThis is expected - the API requires authentication.`);
        toast.error("Presigned URL failed (expected - needs auth)");
        return;
      }

      const { url: signedUrl, key } = await presignedResponse.json();
      setResult(`✅ Got presigned URL: ${key}`);

      // 2. Upload to GCS
      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (uploadResponse.ok) {
        const publicUrl = `https://storage.googleapis.com/mathvideostore/${key}`;
        setResult(`✅ Upload successful! URL: ${publicUrl}`);
        toast.success("Presigned upload successful!");
      } else {
        const errorText = await uploadResponse.text();
        setResult(`❌ Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}\n${errorText}`);
        toast.error(`Upload failed: ${uploadResponse.status}`);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setResult(`❌ Error: ${error.message}`);
      toast.error(`Upload error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">🧪 Simple GCS Upload Test</h1>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select File:</label>
          <Input
            type="file"
            onChange={handleFileChange}
            accept="image/*,video/*,.pdf,.txt"
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <Button onClick={testDirectUpload} disabled={!file || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Test Direct Upload
          </Button>
          
          <Button onClick={testPresignedUpload} disabled={!file || loading} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Test Presigned Upload
          </Button>
        </div>

        {result && (
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Result:</h3>
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium mb-2">📋 Test Instructions:</h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Direct Upload:</strong> Tests if bucket allows public uploads (usually fails)</li>
            <li>• <strong>Presigned Upload:</strong> Tests the proper flow (needs authentication)</li>
            <li>• Check browser console for detailed error messages</li>
            <li>• If CORS errors, run: <code>gsutil cors set cors.json gs://mathvideostore</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
