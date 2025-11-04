import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardCheck, 
  Camera,
  CalendarOff,
  LogOut,
  GraduationCap,
  Shield,
  FileText
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Attendance", href: "/my-attendance", icon: FileText },
  { name: "Students", href: "/students", icon: Users },
  { name: "Manual Attendance", href: "/manual-attendance", icon: ClipboardCheck },
  { name: "Face Recognition", href: "/face-attendance", icon: Camera },
  { name: "Attendance Records", href: "/records", icon: Calendar },
  { name: "Holidays", href: "/holidays", icon: CalendarOff },
  { name: "Admin Management", href: "/admin-management", icon: Shield },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "Successfully logged out",
      });
      navigate("/auth");
    }
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="rounded-lg bg-primary/10 p-2">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg text-foreground">PYDAH</span>
          <span className="text-xs text-muted-foreground">College Attendance</span>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.name} to={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-secondary text-secondary-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
};
