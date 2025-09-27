import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentQuizInterface } from "@/components/student-quiz-interface";

// Mock quiz data - replace with real API call
const getQuizData = async (quizId: string) => {
  return {
    id: quizId,
    title: "Đề thi Hóa học - Chuyên đề Este",
    description: "Kiểm tra kiến thức về este, axit cacboxylic và các hợp chất liên quan",
    timeLimit: 60, // 60 minutes
    totalQuestions: 18,
    questions: [
      {
        id: 1,
        question: "Este X được tạo thành từ ancol etylic và axit fomic có công thức là:",
        options: [
          "HCOOCH₃",
          "CH₃COOCH₃", 
          "HCOOCH₂CH₃",
          "CH₃COOCH₂CH₃"
        ],
        points: 2
      },
      {
        id: 2,
        question: "Este X có tỉ khối hơi so với không khí bằng 2,07. Este X là:",
        options: [
          "HCOOCH₃",
          "CH₃COOCH₃",
          "HCOOCH₂CH₃", 
          "CH₃COOCH₂CH₃"
        ],
        points: 2
      },
      {
        id: 3,
        question: "Chất nào sau đây có nhiệt độ sôi thấp nhất?",
        options: [
          "CH₃COOH",
          "CH₃COOCH₃",
          "CH₃CH₂OH",
          "CH₃CH₂CH₂OH"
        ],
        points: 2
      },
      {
        id: 4,
        question: "Chất nào sau đây là axit béo không no?",
        options: [
          "Axit stearic",
          "Axit oleic", 
          "Axit palmitic",
          "Axit lauric"
        ],
        points: 2
      },
      {
        id: 5,
        question: "Số đồng phân este ứng với công thức phân tử C₄H₈O₂ là:",
        options: ["2", "3", "4", "5"],
        points: 2
      },
      {
        id: 6,
        question: "Loại dầu nào sau đây không phải là este của axit béo và glixerol?",
        options: [
          "Dầu dừa",
          "Dầu đậu nành",
          "Dầu mỡ động vật",
          "Dầu ô liu"
        ],
        points: 2
      },
      {
        id: 7,
        question: "Chất nào sau đây ở điều kiện thường là chất lỏng?",
        options: [
          "CH₃(CH₂)₁₆COOH",
          "CH₃(CH₂)₁₄COOH",
          "CH₃(CH₂)₁₂COOH", 
          "CH₃(CH₂)₁₀COOH"
        ],
        points: 2
      },
      {
        id: 8,
        question: "Este nào sau đây khi thủy phân trong môi trường kiềm cho sản phẩm có khả năng tham gia phản ứng tráng bạc?",
        options: [
          "CH₃COOCH₃",
          "HCOOCH₃",
          "CH₃COOCH₂CH₃",
          "C₂H₅COOCH₃"
        ],
        points: 2
      },
      {
        id: 9,
        question: "Nhóm chức được khoanh tròn trong công thức sau là:",
        options: [
          "Nhóm este",
          "Nhóm axit",
          "Nhóm muối",
          "Nhóm ancol"
        ],
        points: 2
      },
      {
        id: 10,
        question: "Phản ứng este hóa giữa axit và ancol là phản ứng:",
        options: [
          "Thuận nghịch",
          "Một chiều",
          "Oxi hóa khử",
          "Thế"
        ],
        points: 2
      },
      {
        id: 11,
        question: "Để điều chế este từ axit cacboxylic, người ta thường dùng:",
        options: [
          "Ancol và xúc tác H₂SO₄ đặc",
          "Ancol và xúc tác NaOH",
          "Ancol và xúc tác HCl",
          "Ancol và xúc tác KOH"
        ],
        points: 2
      },
      {
        id: 12,
        question: "Este không tan trong nước vì:",
        options: [
          "Không có liên kết hidro với nước",
          "Có phân tử khối lớn",
          "Có cấu trúc phân cực",
          "Có nhóm chức ưa nước"
        ],
        points: 2
      },
      {
        id: 13,
        question: "Phản ứng thủy phân este trong môi trường axit là phản ứng:",
        options: [
          "Thuận nghịch",
          "Một chiều", 
          "Oxi hóa",
          "Khử"
        ],
        points: 2
      },
      {
        id: 14,
        question: "Chất nào sau đây có thể tham gia phản ứng tráng bạc?",
        options: [
          "CH₃COOCH₃",
          "HCOOCH₃",
          "CH₃COOCH₂CH₃",
          "C₂H₅COOCH₃"
        ],
        points: 2
      },
      {
        id: 15,
        question: "Este của axit fomic có đặc điểm:",
        options: [
          "Có thể tham gia phản ứng tráng bạc",
          "Không tan trong nước",
          "Có mùi thơm",
          "Có tính axit"
        ],
        points: 2
      },
      {
        id: 16,
        question: "Số mol NaOH cần để thủy phân hoàn toàn 1 mol este đơn chức là:",
        options: ["0.5 mol", "1 mol", "1.5 mol", "2 mol"],
        points: 2
      },
      {
        id: 17,
        question: "Este nào sau đây có mùi chuối chín?",
        options: [
          "CH₃COOCH₃",
          "CH₃COOCH₂CH₃",
          "CH₃COOCH₂CH₂CH₃",
          "CH₃COOCH₂CH₂CH₂CH₃"
        ],
        points: 2
      },
      {
        id: 18,
        question: "Phản ứng xà phòng hóa là phản ứng thủy phân este trong:",
        options: [
          "Môi trường axit",
          "Môi trường kiềm",
          "Môi trường trung tính",
          "Môi trường nước"
        ],
        points: 2
      }
    ]
  };
};

interface QuizPageProps {
  params: Promise<{ quizId: string }>;
}

const QuizPage = async ({ params }: QuizPageProps) => {
  const { quizId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return redirect("/");
  }

  // Check if user is student
  if (session.user.role !== "STUDENT") {
    return redirect("/teacher");
  }

  const quizData = await getQuizData(quizId);

  const handleQuizSubmit = (answers: Record<number, number>) => {
    // Handle quiz submission
    console.log("Quiz submitted with answers:", answers);
    // Redirect to results page or show success message
  };

  const handleBack = () => {
    // Navigate back to course or dashboard
    window.history.back();
  };

  return (
    <StudentQuizInterface
      quizData={quizData}
      onSubmit={handleQuizSubmit}
      onBack={handleBack}
    />
  );
};

export default QuizPage;
