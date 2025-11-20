'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">500</h1>
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Lỗi hệ thống
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Đã xảy ra lỗi nghiêm trọng. Vui lòng làm mới trang hoặc liên hệ quản trị viên.
              </p>
            </div>
            
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

