/**
 * Script to update a lesson with AI course content
 * Usage: npx tsx app/scripts/update-ai-lesson.ts [lessonId or lessonTitle]
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Convert markdown-like content to HTML
function markdownToHtml(content: string): string {
  return content
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\*\* (.+)$/gm, '<li><strong>$1</strong></li>')
    .replace(/^    \* (.+)$/gm, '<li>$1</li>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
    .replace(/<p><h/g, '<h')
    .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
    .replace(/<p><li>/g, '<ul><li>')
    .replace(/<\/li><\/p>/g, '</li></ul>')
    .replace(/<ul><li>/g, '<ul><li>')
    .replace(/<\/li><\/ul>/g, '</li></ul>')
}

const newLessonContent = `
<h1>KHÓA HỌC: TẠO NỘI DUNG BÀI GIẢNG VỚI CÔNG CỤ TRÍ TUỆ NHÂN TẠO (AI)</h1>

<p><strong>Đối tượng:</strong> Giáo viên, nhà phát triển chương trình giảng dạy, chuyên gia nội dung giáo dục.</p>

<p><strong>Mục tiêu khóa học:</strong> Sau khi hoàn thành khóa học, học viên có thể vận dụng các mô hình AI tiên tiến (như Gemini 3 Pro và GPT-5.1) và công cụ tạo hình ảnh (như Nano Banana Pro) để tự động hóa, tối ưu hóa và nâng cao chất lượng nội dung bài giảng đa phương tiện.</p>

<h2>MODUL 1: NỀN TẢNG VỀ TRÍ TUỆ NHÂN TẠO VÀ CÁC MÔ HÌNH NGÔN NGỮ LỚN (LLM)</h2>

<h3>Bài 1: Giới thiệu về AI và Học máy (Machine Learning)</h3>

<p><strong>Mục tiêu:</strong> Hiểu rõ khái niệm cơ bản về AI, Học máy và các ứng dụng phổ biến.</p>

<p><strong>Nội dung:</strong></p>

<ul>
<li><strong>Khái niệm cơ bản:</strong> Trí tuệ nhân tạo (AI) là khả năng của các hệ thống máy tính thực hiện các nhiệm vụ liên quan đến trí thông minh của con người, như học tập, suy luận và giải quyết vấn đề.</li>

<li><strong>Học máy (Machine Learning - ML):</strong> Là một lĩnh vực của trí tuệ nhân tạo, nghiên cứu các kỹ thuật cho phép hệ thống "học" tự động từ dữ liệu để giải quyết những vấn đề cụ thể. Học máy xây dựng một mô hình dựa trên dữ liệu mẫu (dữ liệu huấn luyện) để đưa ra dự đoán hoặc quyết định mà không cần lập trình chi tiết.
  <ul>
    <li>Các loại giải thuật học máy bao gồm Học có giám sát, Học không giám sát, Học nửa giám sát, Học tăng cường, và Học sâu (Deep Learning).</li>
  </ul>
</li>

<li><strong>Ứng dụng của AI:</strong> AI đã được tích hợp vào các ứng dụng thông thường, thường không còn được gọi là AI vì chúng đã trở nên hữu ích và phổ biến. Trong đó có các ứng dụng nổi bật như công cụ tìm kiếm web tiên tiến, trợ lý ảo (như Trợ lý Google, Siri), và công cụ tạo sinh nội dung (generative AI).</li>
</ul>

<h3>Bài 2: Các Mô hình AI Hàng đầu cho Giáo dục</h3>

<p><strong>Mục tiêu:</strong> Phân biệt và xác định các ưu điểm của Gemini 3 Pro và GPT-5.1.</p>

<p><strong>Nội dung:</strong></p>

<ul>
<li><strong>Gemini 3 Pro (Google):</strong> Được mô tả là mô hình thông minh nhất của Google, tập trung vào khả năng <strong>lập luận tối tân</strong> và là một bước tiến hướng đến "trí tuệ nhân tạo tổng quát" (AGI).
  <ul>
    <li><strong>Điểm mạnh nổi bật:</strong> Đẩy mạnh <strong>tính đa phương thức nguyên bản</strong> (Native multimodal: xử lý văn bản, hình ảnh, âm thanh, video, PDF/tệp lớn như là các phương thức hạng nhất), hỗ trợ <strong>ngữ cảnh rất dài</strong> (lên đến 1,048,576 tokens đầu vào), và khả năng thực hiện các nhiệm vụ phức tạp, nhiều bước (tính năng tác nhân - <em>agentic capabilities</em>).</li>
    <li>Trong lĩnh vực học tập, Gemini 3 mở rộng ranh giới của khả năng lập luận đa phương thức, giúp người dùng học theo cách phù hợp nhất.</li>
  </ul>
</li>

<li><strong>GPT-5.1 (OpenAI):</strong> Đại diện cho bước tiến về AI đa phương thức.
  <ul>
    <li><strong>Điểm mạnh nổi bật:</strong> Tập trung vào <strong>lập luận thích ứng</strong> (<em>adaptive reasoning</em>), độ trễ thấp hơn cho các tác vụ đơn giản, và kiểm soát phong cách/tính cách cho giọng điệu đàm thoại tự nhiên hơn. Nó cũng được tối ưu cho các quy trình tác nhân lặp lại và các công cụ dành cho nhà phát triển.</li>
    <li>GPT-5.1 hỗ trợ đầu vào đa phương thức (Văn bản, hình ảnh, âm thanh, video) và có ngữ cảnh đầu vào là 128,000 tokens.</li>
  </ul>
</li>
</ul>

<h2>MODUL 2: TỐI ƯU HÓA NỘI DUNG VĂN BẢN BÀI GIẢNG</h2>

<h3>Bài 3: Kỹ thuật Tạo Lệnh Hiệu quả (Prompt Engineering)</h3>

<p><strong>Mục tiêu:</strong> Nắm vững kỹ năng viết prompt (câu lệnh) chi tiết để tối đa hóa độ chính xác và tính hữu dụng của nội dung AI.</p>

<p><strong>Nội dung:</strong></p>

<ul>
<li><strong>Nguyên tắc cơ bản:</strong> AI hoạt động tốt nhất khi bạn <strong>cung cấp cụ thể và chi tiết nhất có thể</strong>.</li>

<li><strong>Ứng dụng trong giáo dục:</strong> Thay vì lệnh chung chung, hãy thử lệnh chi tiết:
  <ul>
    <li><em>Thay vì:</em> "Viết về chó"</li>
    <li><em>Thử:</em> "Viết một bài blog giáo dục 200 từ về lợi ích của việc nhận nuôi chó cứu hộ, với giọng điệu thân thiện và khuyến khích dành cho chủ nuôi tiềm năng".</li>
    <li><em>Ví dụ khác:</em> Để có câu trả lời ưng ý, Gemini 3 được cho là vượt trội hơn trong việc hiểu bối cảnh và mục đích đằng sau yêu cầu, giúp người dùng nhận được câu trả lời mong muốn với ít câu lệnh hơn.</li>
  </ul>
</li>
</ul>

<h3>Bài 4: Tạo và Chuyển đổi Nội dung Giảng dạy bằng Văn bản</h3>

<p><strong>Mục tiêu:</strong> Sử dụng Gemini Advanced/GPT-4 để tạo ra các tài liệu giáo khoa dạng văn bản đa dạng.</p>

<p><strong>Công cụ chính:</strong> Gemini Advanced (phiên bản nâng cấp của Gemini, thường được đánh giá là nhỉnh hơn ChatGPT-4 về khả năng tổng hợp văn bản và sáng tạo nội dung).</p>

<p><strong>Nội dung:</strong></p>

<ul>
<li><strong>Tóm tắt chuyên sâu:</strong> Sử dụng AI để tóm tắt các văn bản dài, giữ được ý chính và thông tin quan trọng. Gemini Advanced đặc biệt xuất sắc trong việc tóm tắt văn bản dài và có thể điều chỉnh độ dài bản tóm tắt theo yêu cầu.</li>

<li><strong>Giải thích và Lập luận:</strong> Nhờ Gemini 3 có khả năng <strong>lập luận tối tân</strong>, giáo viên có thể yêu cầu mô hình giải thích các câu hỏi phức tạp hoặc mơ hồ một cách dễ hiểu.</li>

<li><strong>Chuyển đổi định dạng học tập:</strong>
  <ul>
    <li>Biến bài nghiên cứu học thuật, video bài giảng dài thành <strong>flashcard tương tác</strong> hoặc <strong>hình ảnh trực quan</strong>.</li>
    <li>Tạo các định dạng văn bản sáng tạo khác nhau như thơ, kịch bản, hoặc email.</li>
  </ul>
</li>
</ul>

<h2>MODUL 3: THIẾT KẾ HỌC LIỆU TRỰC QUAN VỚI AI ĐA PHƯƠNG THỨC</h2>

<h3>Bài 5: Tạo và Chỉnh sửa Hình ảnh Chất lượng cao (Nano Banana Pro)</h3>

<p><strong>Mục tiêu:</strong> Vận dụng Nano Banana Pro để tạo ra các học liệu hình ảnh chuyên nghiệp và chính xác.</p>

<p><strong>Công cụ chính:</strong> Nano Banana Pro (Gemini 3 Pro Image).</p>

<p><strong>Nội dung:</strong></p>

<ul>
<li><strong>Tạo ảnh từ Văn bản (Text-to-Image):</strong> Sử dụng Nano Banana Pro, mô hình tạo và chỉnh sửa hình ảnh tân tiến nhất được xây dựng trên nền tảng Gemini 3 Pro.
  <ul>
    <li><strong>Ưu điểm cho giáo viên:</strong> Nano Banana Pro có khả năng <strong>tạo hình ảnh với phần chữ chính xác, dễ đọc bằng nhiều ngôn ngữ</strong>, đặc biệt xử lý được <strong>gần như triệt để lỗi sai chữ tiếng Việt</strong>. Điều này rất hữu ích cho việc tạo áp phích, biểu trưng, thiệp mời, hoặc truyện tranh có văn bản rõ ràng.</li>
  </ul>
</li>

<li><strong>Tạo Đồ họa Thông tin (Infographics):</strong> Sử dụng Nano Banana Pro để tạo các hình minh họa hữu ích như infographic hoặc sơ đồ, nhờ khả năng lập luận nâng cao và kiến thức về thế giới thực (kết nối với Google Search).
  <ul>
    <li><em>Ví dụ prompt:</em> "Tạo một infographic minh họa cách pha cafe sữa đá Sài Gòn bằng tiếng Việt, lưu ý đúng chính tả".</li>
  </ul>
</li>

<li><strong>Chỉnh sửa Hình ảnh Nâng cao:</strong>
  <ul>
    <li><strong>Chỉnh sửa cục bộ:</strong> Nhanh chóng chỉnh sửa một số phần cụ thể trong ảnh bằng cách mô tả văn bản (ví dụ: thay nền, đổi áo).</li>
    <li><strong>Kiểm soát chất lượng:</strong> Cung cấp các tùy chọn kiểm soát chuyên sâu như điều chỉnh <strong>góc máy, lấy nét, chỉnh màu và ánh sáng</strong>, với tùy chọn độ phân giải 2K và 4K.</li>
    <li><strong>Pha trộn nhiều ảnh:</strong> Kết hợp các yếu tố từ nhiều ảnh thành một bố cục hoàn chỉnh một cách mượt mà.</li>
  </ul>
</li>
</ul>

<h3>Bài 6: Duy trì Tính nhất quán của Nhân vật và Chủ đề</h3>

<p><strong>Mục tiêu:</strong> Sử dụng Nano Banana Pro để tạo chuỗi hình ảnh cho nội dung có nhân vật hoặc phong cách nhất quán.</p>

<p><strong>Nội dung:</strong></p>

<ul>
<li><strong>Tính nhất quán của nhân vật:</strong> Nano Banana Pro có thể duy trì sự nhất quán của <strong>tối đa 5 nhân vật</strong> trong một thiết kế, hoặc duy trì diện mạo của một người/nhân vật qua nhiều hình ảnh khác nhau. Điều này giúp tạo ra các chuỗi nội dung, truyện tranh giáo dục hoặc nhận diện thương hiệu nhất quán.</li>

<li><strong>Tái tạo Phong cách:</strong> Giáo viên có thể mượn ý tưởng hoạ tiết, màu sắc hoặc phong cách từ một ảnh mẫu bất kỳ rồi áp dụng cho chủ thể khác, giúp đổi phong cách hình ảnh trong tích tắc mà không cần bắt đầu lại từ đầu.</li>
</ul>

<h2>MODUL 4: ỨNG DỤNG NÂNG CAO VÀ ĐẠO ĐỨC TRONG SỬ DỤNG AI</h2>

<h3>Bài 7: Tận dụng Khả năng Lập luận Sâu và Phân tích Dữ liệu Đa Phương thức</h3>

<p><strong>Mục tiêu:</strong> Ứng dụng AI cho các tác vụ phức tạp, đòi hỏi khả năng lập luận sâu (Deep Reasoning).</p>

<p><strong>Công cụ chính:</strong> Gemini 3 Pro (Sử dụng chế độ "Thinking" hoặc "Deep Think").</p>

<p><strong>Nội dung:</strong></p>

<ul>
<li><strong>Phân tích học liệu phức tạp:</strong> Gemini 3 Pro hỗ trợ đầu vào đa phương thức và ngữ cảnh dài (1 triệu tokens), cho phép giáo viên tải toàn bộ tài liệu, video bài giảng dài, hoặc các tệp lớn để yêu cầu phân tích.</li>

<li><strong>Lập luận tối tân:</strong> Mô hình được xây dựng để nắm bắt những tầng ý nghĩa sâu sắc và tinh tế, bao gồm cả việc nhận ra các gợi ý nhỏ hay bóc tách những lớp chồng chéo của một vấn đề phức tạp.</li>

<li><strong>Hỗ trợ học tập cá nhân hóa:</strong> Gemini 3 có thể <strong>giải mã và dịch công thức viết tay</strong> sang nhiều ngôn ngữ, tạo sổ tay nấu ăn. Nó cũng có thể <strong>phân tích video hoạt động thể thao</strong>, xác định điểm cần cải thiện và lên kế hoạch luyện tập, mở ra ứng dụng trong môn Giáo dục thể chất hoặc các lớp kỹ năng.</li>
</ul>

<h3>Bài 8: Trách nhiệm và Minh bạch khi sử dụng AI</h3>

<p><strong>Mục tiêu:</strong> Hiểu về các biện pháp an toàn và nguyên tắc đạo đức khi tạo nội dung giáo dục bằng AI.</p>

<p><strong>Nội dung:</strong></p>

<ul>
<li><strong>An toàn và Đạo đức:</strong> Gemini 3 được Google tuyên bố là mô hình an toàn nhất từ trước đến nay, đã trải qua bộ đánh giá an toàn toàn diện nhất.</li>

<li><strong>Tính minh bạch (Transparency):</strong> Mọi nội dung do công cụ của Google tạo ra đều được gắn <strong>dấu hiệu kỹ thuật số ẩn SynthID</strong> để dễ dàng xác định nguồn gốc nội dung do AI tạo. Tính năng này hiện sử dụng được cho hình ảnh và sẽ sớm hỗ trợ âm thanh cũng như video.
  <ul>
    <li>Watermark (hình mờ) Gemini cũng được duy trì cho người dùng gói miễn phí và Google AI Pro, và được gỡ bỏ cho người dùng gói Google AI Ultra.</li>
  </ul>
</li>

<li><strong>Quản lý Chất lượng Đầu ra:</strong> Kết quả đầu ra của Gemini chủ yếu dựa trên câu lệnh của người dùng. Tuy nhiên, đôi khi AI có thể tạo ra nội dung mà một số cá nhân thấy phản cảm. Người dùng cần liên tục lắng nghe ý kiến phản hồi và sử dụng nút thích/không thích để cải thiện mô hình.</li>
</ul>

<h2>TỔNG KẾT KHÓA HỌC: LỰA CHỌN CÔNG CỤ THEO NHU CẦU</h2>

<ul>
<li><strong>Nếu bạn cần khả năng tổng hợp văn bản chính xác, tạo ra các định dạng nội dung sáng tạo, độc đáo và trả lời câu hỏi phức tạp một cách hiệu quả:</strong> <strong>Gemini Advanced</strong> (hoặc Gemini 3 Pro) là lựa chọn tốt hơn.</li>

<li><strong>Nếu bạn cần tạo hình ảnh với văn bản tiếng Việt đúng chính tả, infographic, và kiểm soát chất lượng hình ảnh chuyên nghiệp:</strong> <strong>Nano Banana Pro</strong> (Gemini 3 Pro Image) là công cụ tối ưu.</li>

<li><strong>Nếu bạn ưu tiên tốc độ xử lý nhanh, giao diện đơn giản, và cần hỗ trợ mạnh mẽ cho các tác vụ lập trình code (nếu có):</strong> <strong>ChatGPT-4</strong> (hoặc GPT-5.1) là lựa chọn phù hợp.</li>
</ul>
`

async function updateLesson(identifier?: string) {
  try {
    let lesson = null

    if (identifier) {
      // Try to find lesson by ID first, then by title
      lesson = await prisma.lesson.findUnique({
        where: { id: identifier },
      })

      if (!lesson) {
        // Try to find by title
        const lessons = await prisma.lesson.findMany({
          where: {
            title: {
              contains: identifier,
              mode: 'insensitive',
            },
          },
        })

        if (lessons.length === 0) {
          console.error(`Không tìm thấy bài học với ID hoặc tiêu đề: ${identifier}`)
          console.log('\nCác bài học hiện có:')
          const allLessons = await prisma.lesson.findMany({
            take: 20,
            select: {
              id: true,
              title: true,
              chapter: {
                select: {
                  title: true,
                  class: {
                    select: {
                      name: true,
                      code: true,
                    },
                  },
                },
              },
            },
          })
          if (allLessons.length === 0) {
            console.log('Không có bài học nào. Đang tạo bài học mới...')
          } else {
            allLessons.forEach((l) => {
              console.log(`- ${l.title} (ID: ${l.id}) [${l.chapter.class.name} - ${l.chapter.title}]`)
            })
            return
          }
        } else if (lessons.length > 1) {
          console.log(`Tìm thấy ${lessons.length} bài học khớp với "${identifier}":`)
          lessons.forEach((l, i) => {
            console.log(`${i + 1}. ${l.title} (ID: ${l.id})`)
          })
          console.log('\nVui lòng chỉ định ID cụ thể.')
          return
        } else {
          lesson = lessons[0]
        }
      }
    }

    // If no lesson found, create a new one
    if (!lesson) {
      console.log('Không tìm thấy bài học. Đang tạo lớp học, chương và bài học mới...')
      
      // Find or create a teacher/admin user
      let teacher = await prisma.user.findFirst({
        where: {
          OR: [
            { role: 'TEACHER' },
            { role: 'ADMIN' },
          ],
        },
      })

      if (!teacher) {
        // Create a default admin user if none exists
        teacher = await prisma.user.create({
          data: {
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'User',
            password: 'hashed_password', // In production, this should be properly hashed
            role: 'ADMIN',
          },
        })
        console.log('Đã tạo user admin mặc định')
      }

      // Create class
      const newClass = await prisma.class.create({
        data: {
          name: 'Khóa học AI cho Giáo viên',
          code: `AI${Date.now()}`,
          description: 'Khóa học về Tạo Nội dung Bài Giảng với Công cụ Trí tuệ Nhân tạo (AI)',
          subject: 'Công nghệ Giáo dục',
          grade: 'Tất cả',
          teacherId: teacher.id,
        },
      })

      // Create chapter
      const newChapter = await prisma.chapter.create({
        data: {
          title: 'Tổng quan về AI trong Giáo dục',
          description: 'Nền tảng về AI và ứng dụng trong giáo dục',
          order: 1,
          classId: newClass.id,
        },
      })

      // Create lesson
      lesson = await prisma.lesson.create({
        data: {
          title: 'Tạo Nội dung Bài Giảng với Công cụ Trí tuệ Nhân tạo (AI)',
          description: 'Khóa học về Tạo Nội dung Bài Giảng với các Công cụ Trí tuệ Nhân tạo (AI) dành cho Giáo viên',
          content: newLessonContent,
          order: 1,
          duration: 120, // 2 hours
          chapterId: newChapter.id,
        },
      })

      console.log(`✅ Đã tạo mới:`)
      console.log(`   Lớp học: ${newClass.name} (ID: ${newClass.id})`)
      console.log(`   Chương: ${newChapter.title} (ID: ${newChapter.id})`)
      console.log(`   Bài học: ${lesson.title} (ID: ${lesson.id})`)
      return
    }

    console.log(`Đang cập nhật bài học: ${lesson.title} (ID: ${lesson.id})`)

    // Update lesson
    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        title: 'Tạo Nội dung Bài Giảng với Công cụ Trí tuệ Nhân tạo (AI)',
        description: 'Khóa học về Tạo Nội dung Bài Giảng với các Công cụ Trí tuệ Nhân tạo (AI) dành cho Giáo viên, được xây dựng dựa trên các khả năng và công cụ AI tiên tiến như Gemini 3 Pro, GPT-5.1 và Nano Banana Pro.',
        content: newLessonContent,
      },
    })

    console.log(`✅ Đã cập nhật thành công bài học: ${updated.title}`)
    console.log(`   ID: ${updated.id}`)
    console.log(`   Mô tả: ${updated.description}`)
    console.log(`   Độ dài nội dung: ${updated.content?.length || 0} ký tự`)
  } catch (error) {
    console.error('Lỗi khi cập nhật bài học:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get identifier from command line arguments (optional)
const identifier = process.argv[2]

// If no identifier provided, create a new lesson
updateLesson(identifier)

