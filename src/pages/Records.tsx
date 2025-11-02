import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";

const SECTIONS = [
  "All Sections",
  "CSE-A",
  "CSE-B",
  "CSE-C",
  "CSE-AI",
  "ECE-A",
  "ECE-B",
  "Mech",
];

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  is_manual: boolean;
  student: {
    roll_number: string;
    name: string;
    class: string;
    section: string;
  };
}

export default function Records() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [sectionFilter, setSectionFilter] = useState("All Sections");
  const { toast } = useToast();

  useEffect(() => {
    loadRecords();
  }, [startDate, endDate, sectionFilter]);

  const loadRecords = async () => {
    let query = supabase
      .from("attendance")
      .select(`
        id,
        date,
        status,
        is_manual,
        students (
          roll_number,
          name,
          class,
          section
        )
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load records",
        variant: "destructive",
      });
    } else {
      let formattedData = data?.map((record: any) => ({
        id: record.id,
        date: record.date,
        status: record.status,
        is_manual: record.is_manual,
        student: record.students,
      })) || [];

      // Apply section filter on client side
      if (sectionFilter && sectionFilter !== "All Sections") {
        formattedData = formattedData.filter(
          (record) => record.student.section === sectionFilter
        );
      }

      setRecords(formattedData);
    }
  };

  const exportToExcel = () => {
    const exportData = records.map((record) => ({
      Date: format(new Date(record.date), "dd/MM/yyyy"),
      "Roll Number": record.student.roll_number,
      Name: record.student.name,
      Year: record.student.class,
      Section: record.student.section,
      Status: record.status.toUpperCase(),
      Type: record.is_manual ? "Manual" : "Face Recognition",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    
    const fileName = `attendance_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Success",
      description: "Attendance exported to Excel",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance Records</h1>
        <p className="text-muted-foreground">View and export attendance history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionFilter">Section</Label>
              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={exportToExcel} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Records ({records.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(new Date(record.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{record.student.roll_number}</TableCell>
                    <TableCell>{record.student.name}</TableCell>
                    <TableCell>{record.student.class}</TableCell>
                    <TableCell>{record.student.section}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
