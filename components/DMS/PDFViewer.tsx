'use client'

import { useState } from 'react'
import { X, Download, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

interface PDFViewerProps {
  fileUrl: string
  fileName?: string
  isOpen: boolean
  onClose: () => void
}

export default function PDFViewer({ fileUrl, fileName, isOpen, onClose }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (!isOpen) return null

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    setZoom(100)
    setRotation(0)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName || 'document.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const viewer = document.getElementById('pdf-viewer-container')
      if (viewer?.requestFullscreen) {
        viewer.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        id="pdf-viewer-container"
        className="relative w-full h-full flex flex-col bg-gray-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <h3 className="text-white font-poppins font-semibold">
              {fileName || 'Xem PDF'}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Thu nhỏ"
              >
                <ZoomOut size={20} />
              </button>
              <span className="text-white font-poppins text-sm min-w-[60px] text-center">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Phóng to"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={handleRotate}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                title="Xoay"
              >
                <RotateCw size={20} />
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-poppins transition-colors"
                title="Đặt lại"
              >
                Đặt lại
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              title="Tải xuống"
            >
              <Download size={20} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-700 hover:bg-red-600 rounded-lg text-white transition-colors"
              title="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-800 p-4">
          <div
            className="mx-auto bg-white shadow-2xl"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center top',
              transition: 'transform 0.3s ease',
            }}
          >
            <iframe
              src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full"
              style={{
                height: `${100 / (zoom / 100)}vh`,
                minHeight: '600px',
              }}
              title="PDF Viewer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 bg-gray-800 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-xs font-poppins">
            Sử dụng các nút điều khiển để phóng to, thu nhỏ và xoay PDF
          </p>
        </div>
      </div>
    </div>
  )
}

