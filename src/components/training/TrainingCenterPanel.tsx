import { useCallback, useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { wave2Api } from "@/lib/wave2Api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

type Course = {
  description: string;
  id: string;
  name: string;
  required: boolean;
};

type CourseAssignment = {
  courseId: string;
  employeeName: string;
  employeeUserId: string;
  id: string;
  status: string;
};

type ProfileOption = {
  fullName: string;
  userId: string;
};

export function TrainingCenterPanel() {
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [courseDescription, setCourseDescription] = useState("");
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [employeeUserId, setEmployeeUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [required, setRequired] = useState("true");

  const load = useCallback(async () => {
    const data = await convex.query(wave2Api.training.getTrainingData, {});
    setAssignments(data.assignments as CourseAssignment[]);
    setCourses(data.courses as Course[]);
    setProfiles(data.profiles as ProfileOption[]);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const createCourse = async () => {
    try {
      await convex.mutation(wave2Api.training.saveCourse, {
        description: courseDescription || undefined,
        name: courseName,
        required: required === "true",
      });
      toast.success("Course created");
      setCourseDialogOpen(false);
      setCourseDescription("");
      setCourseName("");
      setRequired("true");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create course"));
    }
  };

  const assignCourse = async () => {
    try {
      await convex.mutation(wave2Api.training.assignCourse, {
        courseId,
        employeeUserId,
      });
      toast.success("Course assigned");
      setAssignmentDialogOpen(false);
      setCourseId("");
      setEmployeeUserId("");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to assign course"));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Wave 2</p>
          <h2 className="flex items-center gap-2 text-2xl font-serif font-semibold tracking-tight text-foreground">
            <BookOpen className="h-5 w-5" /> Training Center
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage training courses and assign them to employees.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAssignmentDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Assign course
          </Button>
          <Button onClick={() => setCourseDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New course
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Courses <Badge variant="secondary">{courses.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading courses…</p> : null}
            {!loading && courses.length === 0 ? <p className="text-sm text-muted-foreground">No training courses yet.</p> : null}
            {courses.map((course) => (
              <div key={course.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-foreground">{course.name}</h3>
                  <Badge variant={course.required ? "default" : "secondary"}>{course.required ? "required" : "optional"}</Badge>
                </div>
                {course.description ? <p className="mt-2 text-sm text-muted-foreground">{course.description}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Assignments <Badge variant="secondary">{assignments.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading assignments…</p> : null}
            {!loading && assignments.length === 0 ? <p className="text-sm text-muted-foreground">No training assignments yet.</p> : null}
            {assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-foreground">{assignment.employeeName}</h3>
                    <p className="text-sm text-muted-foreground">Course: {courses.find((course) => course.id === assignment.courseId)?.name ?? assignment.courseId}</p>
                  </div>
                  <Badge variant="secondary">{assignment.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create training course</DialogTitle>
            <DialogDescription>Add a new learning or compliance course.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="course-name">Course name</Label>
              <Input id="course-name" value={courseName} onChange={(event) => setCourseName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-description">Description</Label>
              <Input id="course-description" value={courseDescription} onChange={(event) => setCourseDescription(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-required">Required</Label>
              <Select value={required} onValueChange={setRequired}>
                <SelectTrigger id="course-required">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Required</SelectItem>
                  <SelectItem value="false">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>Cancel</Button>
            <Button disabled={!courseName.trim()} onClick={() => void createCourse()}>Create course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign course</DialogTitle>
            <DialogDescription>Assign a course to an employee.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="training-course">Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger id="training-course">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="training-assignee">Employee</Label>
              <Select value={employeeUserId} onValueChange={setEmployeeUserId}>
                <SelectTrigger id="training-assignee">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.userId} value={profile.userId}>
                      {profile.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)}>Cancel</Button>
            <Button disabled={!courseId || !employeeUserId} onClick={() => void assignCourse()}>Assign course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
