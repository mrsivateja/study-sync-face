import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    totalHolidays: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Get total students
    const { count: studentCount } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });

    // Get today's attendance
    const { data: attendance } = await supabase
      .from("attendance")
      .select("status")
      .eq("date", today);

    const presentCount = attendance?.filter((a) => a.status === "present").length || 0;
    const absentCount = attendance?.filter((a) => a.status === "absent").length || 0;

    // Get total holidays
    const { count: holidayCount } = await supabase
      .from("holidays")
      .select("*", { count: "exact", head: true });

    setStats({
      totalStudents: studentCount || 0,
      presentToday: presentCount,
      absentToday: absentCount,
      totalHolidays: holidayCount || 0,
    });
  };

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Present Today",
      value: stats.presentToday,
      icon: CheckCircle,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Absent Today",
      value: stats.absentToday,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Total Holidays",
      value: stats.totalHolidays,
      icon: Calendar,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of attendance management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Use the sidebar to navigate between different sections
          </p>
          <p className="text-sm text-muted-foreground">
            • Mark attendance manually or using face recognition
          </p>
          <p className="text-sm text-muted-foreground">
            • Export attendance records to Excel
          </p>
          <p className="text-sm text-muted-foreground">
            • Manage student information and holidays
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
