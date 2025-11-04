import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string;
  date: string;
  period: number;
  status: string;
  is_manual: boolean;
}

interface AttendanceStats {
  totalPresent: number;
  totalAbsent: number;
  attendancePercentage: number;
}

export default function StudentAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalPresent: 0,
    totalAbsent: 0,
    attendancePercentage: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to view your attendance",
        variant: "destructive",
      });
      return;
    }

    // Get student record for current user
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("id", user.id)
      .single();

    if (studentError || !studentData) {
      toast({
        title: "Error",
        description: "Student record not found",
        variant: "destructive",
      });
      return;
    }

    // Load attendance records
    const { data, error } = await supabase
      .from("attendance")
      .select("id, date, period, status, is_manual")
      .eq("student_id", studentData.id)
      .order("date", { ascending: false })
      .order("period", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive",
      });
    } else {
      setRecords(data || []);
      
      // Calculate stats
      const present = data?.filter(r => r.status === "present").length || 0;
      const absent = data?.filter(r => r.status === "absent").length || 0;
      const total = present + absent;
      const percentage = total > 0 ? (present / total) * 100 : 0;
      
      setStats({
        totalPresent: present,
        totalAbsent: absent,
        attendancePercentage: Math.round(percentage * 10) / 10,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground">View your attendance history</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{stats.totalPresent}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.totalAbsent}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Attendance %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.attendancePercentage}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(new Date(record.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>Period {record.period}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            record.status === "present"
                              ? "bg-secondary/20 text-secondary"
                              : record.status === "absent"
                              ? "bg-destructive/20 text-destructive"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {record.status.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.is_manual ? "Manual" : "Face Recognition"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
