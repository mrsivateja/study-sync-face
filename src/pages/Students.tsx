import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Trash2, Edit, Upload, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SECTIONS = [
  "CSE-A",
  "CSE-B",
  "CSE-C",
  "CSE-AI",
  "ECE-A",
  "ECE-B",
  "Mech",
];

interface Student {
  id: string;
  roll_number: string;
  name: string;
  email: string | null;
  class: string;
  section: string | null;
  photo_url: string | null;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    roll_number: "",
    name: "",
    email: "",
    class: "",
    section: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

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

  const uploadPhoto = async (studentId: string) => {
    if (!photoFile) return null;

    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${studentId}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('student-photos')
      .upload(filePath, photoFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('student-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingStudent) {
        let photo_url = editingStudent.photo_url;
        
        if (photoFile) {
          photo_url = await uploadPhoto(editingStudent.id);
        }

        const { error } = await supabase
          .from("students")
          .update({ ...formData, photo_url })
          .eq("id", editingStudent.id);

        if (error) throw error;

        toast({ title: "Success", description: "Student updated successfully" });
        setIsDialogOpen(false);
        setEditingStudent(null);
        loadStudents();
      } else {
        const { data: newStudent, error } = await supabase
          .from("students")
          .insert([formData])
          .select()
          .single();

        if (error) throw error;

        if (photoFile && newStudent) {
          const photo_url = await uploadPhoto(newStudent.id);
          await supabase
            .from("students")
            .update({ photo_url })
            .eq("id", newStudent.id);
        }

        toast({ title: "Success", description: "Student added successfully" });
        setIsDialogOpen(false);
        loadStudents();
      }

      setFormData({ roll_number: "", name: "", email: "", class: "", section: "" });
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    const { error } = await supabase.from("students").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Student deleted successfully" });
      loadStudents();
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      roll_number: student.roll_number,
      name: student.name,
      email: student.email || "",
      class: student.class,
      section: student.section || "",
    });
    setPhotoPreview(student.photo_url);
    setIsDialogOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">Manage student information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingStudent(null);
              setFormData({ roll_number: "", name: "", email: "", class: "", section: "" });
              setPhotoFile(null);
              setPhotoPreview(null);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? "Edit Student" : "Add New Student"}
              </DialogTitle>
              <DialogDescription>
                {editingStudent ? "Update student information" : "Enter student details"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Photo</Label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={photoPreview} />
                        <AvatarFallback>Photo</AvatarFallback>
                      </Avatar>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Avatar className="h-20 w-20">
                      <AvatarFallback>
                        <Upload className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload student photo for face recognition
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll_number">Roll Number</Label>
                <Input
                  id="roll_number"
                  value={formData.roll_number}
                  onChange={(e) =>
                    setFormData({ ...formData, roll_number: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (for student login)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Students can sign up with this email to view their attendance
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Year</Label>
                <Input
                  id="class"
                  placeholder="e.g., 1st Year, 2nd Year"
                  value={formData.class}
                  onChange={(e) =>
                    setFormData({ ...formData, class: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select
                  value={formData.section}
                  onValueChange={(value) =>
                    setFormData({ ...formData, section: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
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
              <Button type="submit" className="w-full">
                {editingStudent ? "Update Student" : "Add Student"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Roll Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Section</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={student.photo_url || undefined} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{student.roll_number}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {student.email || "-"}
                </TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell>{student.section || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(student)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(student.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
