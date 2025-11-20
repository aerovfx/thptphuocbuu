'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  MoreHorizontal,
  Hash,
  Send,
  Paperclip,
  Smile,
  Image as ImageIcon,
  ArrowLeft,
  Settings,
  MessageSquarePlus,
  Info,
} from 'lucide-react'
import Avatar from '../Common/Avatar'
import ThemeToggle from '../Common/ThemeToggle'
import Logo from '../Common/Logo'
import ComposeMessageModal from './ComposeMessageModal'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import { useEffect } from 'react'

interface Conversation {
  id: string
  user: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
    email: string
  }
  lastMessage: {
    content: string
    createdAt: Date | string
    senderId: string
  } | null
  lastMessageAt: Date | string | null
  unreadCount: number
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: Date | string
  imageUrl?: string | null
  sender: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
  }
}

interface MessagesPageProps {
  conversations: Conversation[]
  currentUser: any
  initialConversation?: Conversation | null
  initialMessages?: Message[]
}

export default function MessagesPage({
  conversations,
  currentUser,
  initialConversation = null,
  initialMessages = [],
}: MessagesPageProps) {
  const router = useRouter()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    initialConversation || (conversations.length > 0 ? conversations[0] : null)
  )
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isComposeOpen, setIsComposeOpen] = useState(false)

  const navigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Khám phá', href: '/explore', icon: Hash },
    { name: 'Thông báo', href: '/notifications', icon: Bell, requireAuth: true },
    { name: 'Tin nhắn', href: '/messages', icon: Mail, requireAuth: true, active: true },
    { name: 'Dấu trang', href: '/bookmarks', icon: Bookmark, requireAuth: true },
    { name: 'Hồ sơ', href: currentUser ? '/dashboard' : '/login', icon: User },
  ]

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation && selectedConversation.id) {
      loadMessages()
    } else if (selectedConversation && !selectedConversation.id) {
      // New conversation, no messages yet
      setMessages([])
    }
  }, [selectedConversation?.id])

  const loadMessages = async () => {
    if (!selectedConversation || !selectedConversation.id) return

    try {
      const response = await fetch(`/api/messages?userId=${selectedConversation.user.id}`)
      const data = await response.json()

      if (data.messages) {
        setMessages(data.messages)
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages([])
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !selectedConversation) return

    const messageContent = message.trim()
    setMessage('')

    // Optimistic update
    const tempMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      senderId: currentUser.user.id,
      createdAt: new Date(),
      sender: {
        id: currentUser.user.id,
        firstName: currentUser.user.name?.split(' ')[0] || 'User',
        lastName: currentUser.user.name?.split(' ').slice(1).join(' ') || '',
        avatar: currentUser.user.image,
      },
    }

    setMessages([...messages, tempMessage])

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedConversation.user.id,
          content: messageContent,
        }),
      })

      const data = await response.json()

      if (data.message) {
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempMessage.id ? data.message : msg))
        )
        
        // If this was a new conversation (no id), update the conversation with the new id
        if (selectedConversation && !selectedConversation.id && data.conversation) {
          setSelectedConversation({
            ...selectedConversation,
            id: data.conversation.id,
            lastMessage: {
              content: data.message.content,
              createdAt: data.message.createdAt,
              senderId: data.message.senderId,
            },
            lastMessageAt: data.message.createdAt,
          })
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id))
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    router.push(`/messages/${conversation.user.id}`)
  }

  return (
    <div className="min-h-screen bg-bluelock-light dark:bg-black text-bluelock-dark dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-bluelock-blue/30 dark:border-gray-800 min-h-screen sticky top-0 transition-colors duration-300">
          <div className="p-4">
            <div className="mb-8 px-4 flex items-center">
              <Logo size={40} className="cursor-pointer" />
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = item.active || false
                const isDisabled = item.requireAuth && !currentUser

                return (
                  <Link
                    key={item.name}
                    href={isDisabled ? '/login' : item.href}
                    className={`flex items-center space-x-4 px-4 py-3 rounded-full hover:bg-bluelock-light-2 dark:hover:bg-gray-900 transition-colors font-poppins relative ${
                      isActive ? 'font-bold text-bluelock-green dark:text-white' : 'text-bluelock-dark dark:text-white'
                    } ${isDisabled ? 'opacity-50' : ''}`}
                  >
                    <item.icon size={24} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {currentUser ? (
              <button
                onClick={() => router.push('/dashboard/social')}
                className="w-full mt-4 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white font-bold py-3 px-4 rounded-full transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
              >
                Đăng
              </button>
            ) : (
              <div className="mt-8 space-y-4">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white font-bold py-3 px-4 rounded-full transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="w-full border border-bluelock-blue dark:border-gray-700 hover:bg-bluelock-light-2 dark:hover:bg-gray-900 text-bluelock-dark dark:text-white font-bold py-3 px-4 rounded-full transition-colors font-poppins"
                >
                  Đăng ký
                </button>
              </div>
            )}

            {/* User Profile Preview */}
            {currentUser && (
              <div className="mt-auto pt-4">
                <div
                  onClick={() => router.push(`/users/${currentUser.user?.id}`)}
                  className="flex items-center justify-between px-3 py-2 rounded-full hover:bg-bluelock-light-2 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={currentUser.user?.image}
                      name={currentUser.user?.name || 'User'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0 hidden xl:block">
                      <p className="font-semibold text-sm truncate font-poppins text-bluelock-dark dark:text-white">
                        {currentUser.user?.name || 'User'}
                      </p>
                      <p className="text-bluelock-dark/60 dark:text-gray-500 text-sm truncate font-poppins">
                        @{currentUser.user?.email?.split('@')[0] || 'user'}
                      </p>
                    </div>
                  </div>
                  <MoreHorizontal size={20} className="text-bluelock-dark/60 dark:text-gray-500 hidden xl:block" />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 border-r border-bluelock-blue/30 dark:border-gray-800 min-h-screen transition-colors duration-300">
          <div className="flex h-screen">
            {/* Conversations List */}
            <div className="w-80 border-r border-bluelock-blue/30 dark:border-gray-800 flex flex-col transition-colors duration-300">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-black backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-10 transition-colors duration-300">
                <div className="px-4 py-3 flex items-center justify-between">
                  <h1 className="text-xl font-bold font-poppins text-gray-900 dark:text-white">Tin nhắn</h1>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsComposeOpen(true)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
                    >
                      <MessageSquarePlus size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
                      <Settings size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
                {/* Search */}
                <div className="px-4 pb-3">
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-full px-4 py-2 flex items-center space-x-3 transition-colors duration-300">
                    <Search size={18} className="text-gray-500" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm tin nhắn trực tiếp"
                      className="bg-transparent border-none outline-none text-gray-900 dark:text-white flex-1 placeholder:text-gray-500 text-sm font-poppins"
                    />
                  </div>
                </div>
                {/* Chat Section */}
                <div className="px-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquarePlus size={18} className="text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Chat</span>
                    </div>
                    <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-full transition-colors">
                      Bản thử nghiệm
                    </button>
                  </div>
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <Mail className="mx-auto text-bluelock-dark/40 dark:text-gray-400 mb-4" size={48} />
                    <p className="text-bluelock-dark/60 dark:text-gray-500 font-poppins">
                      Chưa có cuộc trò chuyện nào
                    </p>
                    <p className="text-bluelock-dark/60 dark:text-gray-500 text-sm mt-2 font-poppins">
                      Bắt đầu trò chuyện với bạn bè của bạn
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-bluelock-blue/30 dark:divide-gray-800">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`px-4 py-3 hover:bg-bluelock-light-2 dark:hover:bg-gray-900 cursor-pointer transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? 'bg-bluelock-light-2 dark:bg-gray-900'
                            : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar
                            src={conversation.user.avatar}
                            name={`${conversation.user.firstName} ${conversation.user.lastName}`}
                            size="md"
                            userId={conversation.user.id}
                            clickable={true}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-sm font-poppins text-bluelock-dark dark:text-white truncate">
                                {conversation.user.firstName} {conversation.user.lastName}
                              </p>
                              {conversation.lastMessage && conversation.lastMessageAt && (
                                <p className="text-xs text-bluelock-dark/60 dark:text-gray-500 font-poppins flex-shrink-0 ml-2">
                                  {formatDistanceToNow(
                                    typeof conversation.lastMessageAt === 'string' 
                                      ? new Date(conversation.lastMessageAt) 
                                      : conversation.lastMessageAt,
                                    {
                                      addSuffix: true,
                                      locale: vi,
                                    }
                                  )}
                                </p>
                              )}
                            </div>
                            {conversation.lastMessage ? (
                              <p className="text-sm text-bluelock-dark/60 dark:text-gray-500 font-poppins truncate">
                                {conversation.lastMessage.content}
                              </p>
                            ) : (
                              <p className="text-sm text-bluelock-dark/60 dark:text-gray-500 font-poppins italic">
                                Chưa có tin nhắn
                              </p>
                            )}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="flex-shrink-0">
                              <span className="bg-bluelock-green dark:bg-blue-500 text-black dark:text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center font-poppins">
                                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="sticky top-0 bg-white dark:bg-black backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-10 transition-colors duration-300">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => router.push('/messages')}
                          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
                        >
                          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <Avatar
                          src={selectedConversation.user.avatar}
                          name={`${selectedConversation.user.firstName} ${selectedConversation.user.lastName}`}
                          size="md"
                          userId={selectedConversation.user.id}
                          clickable={true}
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-semibold font-poppins text-gray-900 dark:text-white">
                              {selectedConversation.user.firstName} {selectedConversation.user.lastName}
                            </p>
                            <span className="text-blue-500">
                              <svg
                                viewBox="0 0 22 22"
                                aria-label="Tài khoản được xác minh"
                                className="w-4 h-4"
                                fill="currentColor"
                              >
                                <g>
                                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.29 1.903.164.636-.127 1.22-.432 1.68-.877.46-.47.776-1.055.898-1.7.12-.647.07-1.322-.195-1.947.587-.274 1.088-.705 1.443-1.246.356-.54.555-1.17.574-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"></path>
                                </g>
                              </svg>
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                            @{selectedConversation.user.email.split('@')[0]}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
                        <Info size={20} className="text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-black">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Mail className="mx-auto text-gray-400 mb-4" size={48} />
                          <p className="text-gray-500 dark:text-gray-400 font-poppins">
                            Chưa có tin nhắn nào
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-poppins">
                            Bắt đầu một tin nhắn mới
                          </p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.senderId === currentUser.user.id
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                isOwn
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                              } font-poppins`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              {msg.imageUrl && (
                                <img
                                  src={msg.imageUrl}
                                  alt="Attachment"
                                  className="mt-2 rounded-lg max-w-full"
                                />
                              )}
                              <p
                                className={`text-xs mt-1 ${
                                  isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                                }`}
                              >
                                {formatDistanceToNow(new Date(msg.createdAt), {
                                  addSuffix: true,
                                  locale: vi,
                                })}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-black transition-colors duration-300">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-full px-4 py-2 flex items-center space-x-2 transition-colors duration-300">
                        <button
                          type="button"
                          className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                          <ImageIcon size={18} />
                        </button>
                        <button
                          type="button"
                          className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                          title="GIF"
                        >
                          <ImageIcon size={18} />
                        </button>
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Bắt đầu một tin nhắn mới"
                          className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-500 font-poppins"
                        />
                        <button
                          type="button"
                          className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                          <Smile size={18} />
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={!message.trim()}
                        className="p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                      >
                        <Send size={20} />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Mail className="mx-auto text-bluelock-dark/40 dark:text-gray-400 mb-4" size={64} />
                    <h2 className="text-2xl font-bold font-poppins text-bluelock-dark dark:text-white mb-2">
                      Chọn một cuộc trò chuyện
                    </h2>
                    <p className="text-bluelock-dark/60 dark:text-gray-500 font-poppins">
                      Bắt đầu trò chuyện với bạn bè của bạn
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 p-6 hidden lg:block">
          <div className="sticky top-4 space-y-6">
            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const input = e.currentTarget.querySelector('input') as HTMLInputElement
                if (input?.value.trim()) {
                  router.push(`/explore?q=${encodeURIComponent(input.value.trim())}`)
                }
              }}
              className="bg-bluelock-light-2 dark:bg-gray-900 rounded-full px-4 py-3 flex items-center space-x-3 transition-colors duration-300"
            >
              <Search size={20} className="text-bluelock-dark/60 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Tìm kiếm"
                className="bg-transparent border-none outline-none text-bluelock-dark dark:text-white flex-1 placeholder:text-bluelock-dark/50 dark:placeholder:text-gray-500 font-poppins"
              />
            </form>

            {/* New Message Button */}
            <button
              onClick={() => {
                // TODO: Open new message modal
                alert('Tính năng tạo tin nhắn mới đang được phát triển')
              }}
              className="w-full bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white font-bold py-3 px-4 rounded-full transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
            >
              Tin nhắn mới
            </button>

            {/* Info */}
            <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-2xl p-4 border border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
              <h2 className="text-lg font-bold mb-2 font-poppins text-bluelock-dark dark:text-white">
                Mẹo sử dụng
              </h2>
              <ul className="space-y-2 text-sm text-bluelock-dark/70 dark:text-gray-400 font-poppins">
                <li>• Nhấn Enter để gửi tin nhắn</li>
                <li>• Kéo thả file để đính kèm</li>
                <li>• Click vào avatar để xem profile</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
      <ThemeToggle />
      <ComposeMessageModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        currentUserId={currentUser.user.id}
      />
    </div>
  )
}

