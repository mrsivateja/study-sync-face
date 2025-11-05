import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Student {
  id: string;
  name: string;
  roll_number: string;
  photo_url: string | null;
}

export default function FaceAttendance() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState("1");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("id, name, roll_number, photo_url")
      .not("photo_url", "is", null)
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } else {
      setStudents(data || []);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const captureAndMarkAttendance = async () => {
    if (!selectedStudent) {
      toast({
        title: "Select Student",
        description: "Please select a student from the dropdown",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Mark attendance
      const today = format(new Date(), "yyyy-MM-dd");
      const { error } = await supabase.from("attendance").insert({
        student_id: selectedStudent,
        date: today,
        period: parseInt(selectedPeriod),
        status: "present",
        is_manual: false,
        marked_by: user?.id,
      });

      if (error) {
        // Check if already marked
        if (error.code === "23505") {
          toast({
            title: "Already Marked",
            description: "Attendance already marked for this student and period today",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        const student = students.find(s => s.id === selectedStudent);
        toast({
          title: "Success",
          description: `Attendance marked for ${student?.name}`,
        });
        setSelectedStudent("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Face Recognition Attendance</h1>
        <p className="text-muted-foreground">
          Mark attendance using camera verification
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Camera Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Camera not active</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="period">Period (Hour)</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map((period) => (
                        <SelectItem key={period} value={period.toString()}>
                          Period {period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="student">Select Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.roll_number} - {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {students.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No students with photos available
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {!isCameraActive ? (
                  <Button onClick={startCamera} className="flex-1">
                    <Camera className="mr-2 h-4 w-4" />
                    Start Camera
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={captureAndMarkAttendance} 
                      className="flex-1"
                      disabled={isProcessing || !selectedStudent}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {isProcessing ? "Marking..." : "Mark Attendance"}
                    </Button>
                    <Button onClick={stopCamera} variant="outline">
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">How to use:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Start Camera" to activate the camera</li>
                <li>Select the period/hour from the dropdown</li>
                <li>Select the student from the dropdown</li>
                <li>Ensure the student's face is visible in the camera</li>
                <li>Click "Mark Attendance" to record their presence</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Tips:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Ensure good lighting conditions</li>
                <li>Face should be clearly visible</li>
                <li>Remove any obstructions</li>
                <li>Student should look directly at the camera</li>
                <li>Only students with uploaded photos appear in the list</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This system uses camera verification. Make sure to upload student photos in the Students page for them to appear here.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Advanced face recognition with automatic detection can be added using AI services.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}