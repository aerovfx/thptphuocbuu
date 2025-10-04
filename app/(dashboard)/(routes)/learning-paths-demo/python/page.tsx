import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, BookOpen, Users, Clock } from "lucide-react";

export default function PythonLearningPathPage() {
  const chapters = [
    {
      title: "Python Cơ bản - Lớp 10",
      description: "Làm quen với Python và các khái niệm cơ bản",
      lessons: 5,
      duration: "2 tuần",
      topics: ["Giới thiệu Python", "Biến và kiểu dữ liệu", "Input/Output", "Toán tử"]
    },
    {
      title: "Cấu trúc điều khiển - Lớp 10", 
      description: "if/else, vòng lặp và logic điều khiển chương trình",
      lessons: 4,
      duration: "1.5 tuần",
      topics: ["if/elif/else", "Vòng lặp for/while", "break/continue", "Bài tập thực hành"]
    },
    {
      title: "Cấu trúc dữ liệu - Lớp 11",
      description: "List, Tuple, Set, Dictionary và ứng dụng",
      lessons: 4,
      duration: "2 tuần", 
      topics: ["List và Tuple", "Set và Dictionary", "List Comprehension", "Quản lý điểm số"]
    },
    {
      title: "Hàm và Module - Lớp 11",
      description: "Tạo hàm, sử dụng module và thư viện",
      lessons: 4,
      duration: "2 tuần",
      topics: ["Định nghĩa hàm", "Tham số và return", "Module và thư viện", "Thư viện toán học"]
    },
    {
      title: "Lập trình hướng đối tượng - Lớp 12",
      description: "Class, Object, kế thừa trong Python",
      lessons: 4,
      duration: "2.5 tuần",
      topics: ["Class và Object", "Constructor và Method", "Kế thừa", "Hệ thống quản lý"]
    },
    {
      title: "Xử lý dữ liệu - Lớp 12",
      description: "Đọc/ghi file, exception handling",
      lessons: 3,
      duration: "1.5 tuần",
      topics: ["Đọc và ghi file", "Exception Handling", "Phân tích dữ liệu"]
    },
    {
      title: "Thư viện khoa học - Lớp 12",
      description: "NumPy, Pandas, Matplotlib cho STEM",
      lessons: 4,
      duration: "2 tuần",
      topics: ["NumPy cơ bản", "Pandas cơ bản", "Matplotlib cơ bản", "Phân tích thí nghiệm"]
    },
    {
      title: "Dự án STEM - Lớp 12",
      description: "Các dự án thực tế cho học sinh STEM",
      lessons: 4,
      duration: "3 tuần",
      topics: ["Máy tính khoa học", "Phân tích dữ liệu khí hậu", "Mô phỏng vật lý", "Dự án cuối khóa"]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-lg bg-orange-500 text-white">
            <Code2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Python Programming for STEM Students</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Khóa học Python toàn diện dành cho học sinh STEM từ lớp 10-12, 
          từ cơ bản đến nâng cao với các dự án thực tế
        </p>
        
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>32 bài học</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>16 tuần</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Lớp 10-12</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-center">Nội dung khóa học</h2>
        
        <div className="grid gap-4">
          {chapters.map((chapter, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{chapter.title}</CardTitle>
                    <CardDescription className="mt-2">{chapter.description}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">{chapter.lessons} bài học</Badge>
                    <Badge variant="outline">{chapter.duration}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {chapter.topics.map((topic, topicIndex) => (
                    <Badge key={topicIndex} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-blue-50 p-6 rounded-lg text-center">
          <h3 className="text-xl font-bold text-blue-900 mb-2">Sẵn sàng bắt đầu?</h3>
          <p className="text-blue-700 mb-4">
            Đăng nhập để truy cập đầy đủ nội dung khóa học và bắt đầu học Python ngay hôm nay!
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/sign-in" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Đăng nhập
            </Link>
            <Link href="/sign-up" className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors">
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
