import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle, XCircle, Save } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Student {
  id: string;
  roll_number: string;
  name: string;
  class: string;
}

interface AttendanceStatus {
  [key: string]: "present" | "absent" | null;
}

export default function ManualAttendance() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendance, setAttendance] = useState<AttendanceStatus>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    loadExistingAttendance();
  }, [selectedDate, students]);

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("roll_number");

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

  const loadExistingAttendance = async () => {
    if (students.length === 0) return;

    const { data } = await supabase
      .from("attendance")
      .select("student_id, status")
      .eq("date", selectedDate);

    const attendanceMap: AttendanceStatus = {};
    data?.forEach((record) => {
      attendanceMap[record.student_id] = record.status as "present" | "absent";
    });
    setAttendance(attendanceMap);
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const records = Object.entries(attendance)
        .filter(([_, status]) => status !== null)
        .map(([studentId, status]) => ({
          student_id: studentId,
          date: selectedDate,
          status,
          is_manual: true,
          marked_by: user?.id,
        }));

      // Delete existing attendance for the date
      await supabase
        .from("attendance")
        .delete()
        .eq("date", selectedDate);

      // Insert new attendance records
      const { error } = await supabase.from("attendance").insert(records);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attendance saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAllPresent = () => {
    const newAttendance: AttendanceStatus = {};
    students.forEach((student) => {
      newAttendance[student.id] = "present";
    });
    setAttendance(newAttendance);
  };

  const markAllAbsent = () => {
    const newAttendance: AttendanceStatus = {};
    students.forEach((student) => {
      newAttendance[student.id] = "absent";
    });
    setAttendance(newAttendance);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manual Attendance</h1>
        <p className="text-muted-foreground">Mark attendance for students</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button variant="outline" onClick={markAllPresent}>
                <CheckCircle className="mr-2 h-4 w-4" />
                All Present
              </Button>
              <Button variant="outline" onClick={markAllAbsent}>
                <XCircle className="mr-2 h-4 w-4" />
                All Absent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mark Attendance</CardTitle>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Attendance"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {student.roll_number} • {student.class}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={attendance[student.id] === "present" ? "default" : "outline"}
                    className={attendance[student.id] === "present" ? "bg-secondary hover:bg-secondary/90" : ""}
                    onClick={() => {
                      setAttendance((prev) => ({ ...prev, [student.id]: "present" }));
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Present
                  </Button>
                  <Button
                    variant={attendance[student.id] === "absent" ? "destructive" : "outline"}
                    onClick={() => {
                      setAttendance((prev) => ({ ...prev, [student.id]: "absent" }));
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Absent
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
