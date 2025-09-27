"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  FileEdit,
  Calendar,
  Upload,
  Download
} from "lucide-react";

interface ChapterAssignmentFormProps {
  initialData: any;
  courseId: string;
  chapterId: string;
}

// Mock data for categories
const mockCategories = [
  { id: "toan-10", name: "Toán 10" },
  { id: "toan-11", name: "Toán 11" },
];

export const ChapterAssignmentForm = ({
  initialData,
  courseId,
  chapterId
}: ChapterAssignmentFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [chapterAssignments, setChapterAssignments] = useState([
    {
      id: 1,
      title: "Bài tập Chương 1 - Phương trình bậc nhất",
      description: "Giải các phương trình bậc nhất một ẩn",
      categoryId: "toan-10",
      categoryName: "Toán 10",
      instructions: "Học sinh làm bài và nộp file PDF",
      points: 100,
      dueDate: "2024-02-15",
      submissions: 0,
      status: "Published",
      createdAt: "2024-01-20"
    }
  ]);

  // Assignment creation state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    categoryId: "",
    instructions: "",
    points: 100,
    dueDate: "",
    status: "Published"
  });

  const handleCreateAssignment = () => {
    const assignment = {
      id: chapterAssignments.length + 1,
      ...newAssignment,
      categoryName: mockCategories.find(c => c.id === newAssignment.categoryId)?.name || "",
      submissions: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setChapterAssignments([...chapterAssignments, assignment]);
    setNewAssignment({
      title: "",
      description: "",
      categoryId: "",
      instructions: "",
      points: 100,
      dueDate: "",
      status: "Published"
    });
    setIsCreateDialogOpen(false);
    toast.success("Assignment created successfully!");
  };

  const handleDeleteAssignment = (id: number) => {
    setChapterAssignments(chapterAssignments.filter(assignment => assignment.id !== id));
    toast.success("Assignment deleted!");
  };

  const handleToggleStatus = (id: number) => {
    setChapterAssignments(chapterAssignments.map(assignment => 
      assignment.id === id 
        ? { ...assignment, status: assignment.status === "Published" ? "Draft" : "Published" }
        : assignment
    ));
    toast.success("Assignment status updated!");
  };

  return (
    <div className="mt-6 border bg-slate-50 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <FileEdit className="h-4 w-4" />
          Chapter Assignments
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Assignment for Chapter</DialogTitle>
              <DialogDescription>
                Create an assignment that will be linked to this chapter
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Assignment Title</Label>
                <Input
                  id="title"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                  placeholder="Enter assignment title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  placeholder="Enter assignment description"
                />
              </div>
              <div>
                <Label htmlFor="category">Knowledge Category</Label>
                <select
                  id="category"
                  value={newAssignment.categoryId}
                  onChange={(e) => setNewAssignment({...newAssignment, categoryId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a category</option>
                  {mockCategories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={newAssignment.instructions}
                  onChange={(e) => setNewAssignment({...newAssignment, instructions: e.target.value})}
                  placeholder="Enter detailed instructions for students"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newAssignment.points}
                    onChange={(e) => setNewAssignment({...newAssignment, points: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={newAssignment.status}
                  onChange={(e) => setNewAssignment({...newAssignment, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAssignment}>
                  Create Assignment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 space-y-3">
        {chapterAssignments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileEdit className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No assignments created yet</p>
            <p className="text-sm">Create your first assignment to get started</p>
          </div>
        ) : (
          chapterAssignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <Badge variant={assignment.status === "Published" ? "default" : "secondary"}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {assignment.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">{assignment.categoryName}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {assignment.points} points
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {assignment.dueDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {assignment.submissions} submissions
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleStatus(assignment.id)}
                    >
                      {assignment.status === "Published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Instructions:</h4>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded border">
                    {assignment.instructions}
                  </p>
                </div>
                
                {assignment.submissions > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Submissions: {assignment.submissions}</span>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        View All
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
