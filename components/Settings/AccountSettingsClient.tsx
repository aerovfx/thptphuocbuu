'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Avatar from '@/components/Common/Avatar'

type MeUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar: string | null
  coverPhoto: string | null
  role: string
  bio: string | null
  phone: string | null
  dateOfBirth: string | null
  createdAt: string
  updatedAt: string
  hasPassword: boolean
  providers: string[]
}

export default function AccountSettingsClient() {
  const router = useRouter()
  const { status, update } = useSession()
  const [me, setMe] = useState<MeUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('') // YYYY-MM-DD

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const canRender = useMemo(() => status !== 'loading', [status])

  const loadMe = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await fetch('/api/users/me', { method: 'GET', cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể tải thông tin tài khoản')

      const user: MeUser = {
        ...data,
        // Normalize date to YYYY-MM-DD for date input
        dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth).slice(0, 10) : null,
      }

      setMe(user)
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setPhone(user.phone || '')
      setBio(user.bio || '')
      setDateOfBirth(user.dateOfBirth || '')
    } catch (e: any) {
      setError(e?.message || 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!me) return
    setError(null)
    setSuccess(null)

    if (!file.type.startsWith('image/')) {
      setError('Avatar phải là file hình ảnh')
      return
    }
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Kích thước avatar không được vượt quá 5MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/users/${me.id}/avatar`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể cập nhật avatar')

      setMe((prev) => (prev ? { ...prev, avatar: data.url || prev.avatar } : prev))
      setSuccess('Đã cập nhật avatar')

      // Refresh NextAuth session token/avatar so the new avatar shows across the app
      try {
        await update?.()
      } catch {
        // ignore
      }

      router.refresh()
      await loadMe()
    } catch (e: any) {
      setError(e?.message || 'Đã xảy ra lỗi')
    } finally {
      setUploadingAvatar(false)
    }
  }

  useEffect(() => {
    if (!canRender) return
    // If not authenticated, server page should redirect; but keep safe here too.
    if (status !== 'authenticated') {
      setLoading(false)
      return
    }
    loadMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRender, status])

  const handleSaveProfile = async () => {
    setError(null)
    setSuccess(null)
    setSavingProfile(true)
    try {
      const payload: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() ? phone.trim() : null,
        bio: bio.trim() ? bio.trim() : null,
        dateOfBirth: dateOfBirth ? dateOfBirth : null,
      }

      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể cập nhật thông tin')

      setSuccess('Đã cập nhật thông tin cá nhân')
      // Update local state from server response to avoid stale cache/slow refresh
      if (data?.user) {
        setMe((prev) => (prev ? { ...prev, ...data.user } : data.user))
        setFirstName(data.user.firstName || '')
        setLastName(data.user.lastName || '')
        setPhone(data.user.phone || '')
        setBio(data.user.bio || '')
        setDateOfBirth(data.user.dateOfBirth ? String(data.user.dateOfBirth).slice(0, 10) : '')
      } else {
        await loadMe()
      }
    } catch (e: any) {
      setError(e?.message || 'Đã xảy ra lỗi')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    setError(null)
    setSuccess(null)

    if (!newPassword || newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp')
      return
    }
    if (me?.hasPassword && !currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại')
      return
    }

    setSavingPassword(true)
    try {
      const res = await fetch('/api/users/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(me?.hasPassword ? { currentPassword } : {}),
          newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể đổi mật khẩu')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess(data.message || 'Thành công')
      await loadMe()
    } catch (e: any) {
      setError(e?.message || 'Đã xảy ra lỗi')
    } finally {
      setSavingPassword(false)
    }
  }

  if (!canRender) return null

  return (
    <div className="space-y-6">
      {(error || success) && (
        <div
          className={`rounded-lg border p-4 font-poppins ${
            error
              ? 'bg-red-500/10 border-red-500/40 text-red-300'
              : 'bg-green-500/10 border-green-500/40 text-green-300'
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 font-poppins">Thông tin cá nhân</h2>

        {loading ? (
          <div className="text-gray-400 font-poppins">Đang tải...</div>
        ) : !me ? (
          <div className="text-gray-400 font-poppins">Không thể tải thông tin</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">Avatar</label>
              <div className="flex items-center gap-4">
                <Avatar
                  src={me.avatar}
                  name={`${me.firstName} ${me.lastName}`.trim() || me.email}
                  size="lg"
                  className="border border-gray-700"
                />
                <div>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingAvatar}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleAvatarUpload(f)
                        // allow re-selecting same file
                        e.currentTarget.value = ''
                      }}
                    />
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-lg font-poppins font-semibold transition-colors cursor-pointer ${
                        uploadingAvatar
                          ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {uploadingAvatar ? 'Đang tải...' : 'Thay avatar'}
                    </span>
                  </label>
                  <div className="mt-2 text-xs text-gray-500 font-poppins">Chỉ ảnh, tối đa 5MB.</div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">Họ</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                placeholder="Nhập họ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">Tên</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                placeholder="Nhập tên"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">Email</label>
              <input
                value={me.email}
                readOnly
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-poppins"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">Vai trò</label>
              <input
                value={me.role}
                readOnly
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-poppins"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">Số điện thoại</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                placeholder="VD: 090..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">Ngày sinh</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">Giới thiệu</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                placeholder="Bạn có thể giới thiệu ngắn về mình..."
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold transition-colors"
              >
                {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 font-poppins">Bảo mật</h2>

        {loading ? (
          <div className="text-gray-400 font-poppins">Đang tải...</div>
        ) : !me ? (
          <div className="text-gray-400 font-poppins">Không thể tải thông tin</div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-400 font-poppins">
              <div>
                <span className="text-gray-500">Nhà cung cấp đăng nhập:</span>{' '}
                <span className="text-gray-300">{me.providers.length ? me.providers.join(', ') : 'credentials'}</span>
              </div>
              <div>
                <span className="text-gray-500">Mật khẩu:</span>{' '}
                <span className="text-gray-300">{me.hasPassword ? 'Đã thiết lập' : 'Chưa thiết lập'}</span>
              </div>
            </div>

            {!me.hasPassword && (
              <div className="mb-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 font-poppins text-sm">
                Tài khoản của bạn đang đăng nhập bằng Google/OAuth và **chưa có mật khẩu**. Bạn có thể đặt mật khẩu để
                đăng nhập bằng email/mật khẩu khi cần.
              </div>
            )}

            <div className="space-y-4">
              {me.hasPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">
                  {me.hasPassword ? 'Mật khẩu mới' : 'Mật khẩu'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                  placeholder="Ít nhất 8 ký tự"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold transition-colors"
                >
                  {savingPassword ? 'Đang lưu...' : me.hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-poppins transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


