import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserPlus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emailToAdd, setEmailToAdd] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    // Get all user_roles with admin role
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      toast({
        title: "Error",
        description: "Failed to load admins",
        variant: "destructive",
      });
      return;
    }

    if (!adminRoles || adminRoles.length === 0) {
      setAdmins([]);
      return;
    }

    // Get profile information for admin users
    const adminIds = adminRoles.map((role) => role.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", adminIds);

    if (profilesError) {
      toast({
        title: "Error",
        description: "Failed to load admin profiles",
        variant: "destructive",
      });
    } else {
      setAdmins(profiles || []);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", emailToAdd)
      .single();

    if (profileError || !profile) {
      toast({
        title: "Error",
        description: "User with this email not found. They must sign up first.",
        variant: "destructive",
      });
      return;
    }

    // Add admin role
    const { error } = await supabase
      .from("user_roles")
      .insert([{ user_id: profile.id, role: "admin" }]);

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already Admin",
          description: "This user is already an admin",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Success",
        description: "Admin role granted successfully",
      });
      setIsDialogOpen(false);
      setEmailToAdd("");
      loadAdmins();
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to remove admin access for this user?")) return;

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove admin role",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Admin role removed successfully",
      });
      loadAdmins();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <p className="text-muted-foreground">Manage admin access for users</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Grant Admin Access
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Admin Access</DialogTitle>
              <DialogDescription>
                Enter the email of the user you want to make an admin. The user must
                have already signed up.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">User Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={emailToAdd}
                  onChange={(e) => setEmailToAdd(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Grant Admin Access
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Admins
          </CardTitle>
          <CardDescription>
            Users with administrative access to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No admins found. Grant admin access to start managing the system.
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.full_name || "N/A"}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAdmin(admin.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Grant Admin Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>User must first sign up for an account</li>
            <li>Click "Grant Admin Access" button above</li>
            <li>Enter the user's email address</li>
            <li>The user will immediately have admin privileges</li>
          </ol>
          <p className="text-sm text-muted-foreground pt-4">
            <strong>Note:</strong> Only users with admin access can view and manage
            students, attendance, and other system features.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
