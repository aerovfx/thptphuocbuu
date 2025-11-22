/**
 * Digital Signature Configuration
 * 
 * Cấu hình cho các nhà cung cấp dịch vụ ký số:
 * - VNPT Smart CA
 * - Viettel CA
 * - FPT CA
 * - MISA
 * - Internal (ký nội bộ)
 */

export interface CAProviderConfig {
  name: string
  apiBaseUrl: string
  apiKey?: string
  apiSecret?: string
  enabled: boolean
  authType: 'api_key' | 'oauth' | 'certificate'
  callbackUrl?: string
  endpoints: {
    sign: string
    verify: string
    getCertificate?: string
    createTransaction?: string
    confirmTransaction?: string
    getChallenge?: string
    getResult?: string
    getStatus?: string
  }
}

export const CA_PROVIDERS: Record<string, CAProviderConfig> = {
  VNPT: {
    name: 'VNPT Smart CA',
    apiBaseUrl: process.env.VNPT_SMARTCA_API_URL || 'https://api.smartca.vnpt.vn',
    apiKey: process.env.VNPT_SMARTCA_API_KEY,
    apiSecret: process.env.VNPT_SMARTCA_API_SECRET,
    enabled: !!process.env.VNPT_SMARTCA_API_KEY,
    authType: 'api_key',
    endpoints: {
      sign: '/api/v1/sign',
      verify: '/api/v1/verify',
      getCertificate: '/api/v1/certificate',
      createTransaction: '/api/v1/signature/create', // API Gateway: Gửi yêu cầu ký
      confirmTransaction: '/api/v1/signature/confirm',
      getChallenge: '/api/v1/signature/challenge', // Lấy challenge code
      getResult: '/api/v1/signature/result', // Nhận chữ ký số
      getStatus: '/api/v1/signature/status', // Kiểm tra trạng thái
    },
    callbackUrl: process.env.VNPT_SMARTCA_CALLBACK_URL || process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/smartca/callback`
      : 'https://your-domain.com/api/smartca/callback',
  },
  VIETTEL: {
    name: 'Viettel CA',
    apiBaseUrl: process.env.VIETTEL_CA_API_URL || 'https://api.viettelca.vn',
    apiKey: process.env.VIETTEL_CA_API_KEY,
    apiSecret: process.env.VIETTEL_CA_API_SECRET,
    enabled: !!process.env.VIETTEL_CA_API_KEY,
    authType: 'api_key',
    endpoints: {
      sign: '/api/v1/sign',
      verify: '/api/v1/verify',
      getCertificate: '/api/v1/certificate',
    },
  },
  FPT: {
    name: 'FPT CA',
    apiBaseUrl: process.env.FPT_CA_API_URL || 'https://api.fptca.vn',
    apiKey: process.env.FPT_CA_API_KEY,
    apiSecret: process.env.FPT_CA_API_SECRET,
    enabled: !!process.env.FPT_CA_API_KEY,
    authType: 'api_key',
    endpoints: {
      sign: '/api/v1/sign',
      verify: '/api/v1/verify',
    },
  },
  MISA: {
    name: 'MISA',
    apiBaseUrl: process.env.MISA_API_URL || 'https://api.misa.vn',
    apiKey: process.env.MISA_API_KEY,
    apiSecret: process.env.MISA_API_SECRET,
    enabled: !!process.env.MISA_API_KEY,
    authType: 'api_key',
    endpoints: {
      sign: '/api/v1/sign',
      verify: '/api/v1/verify',
    },
  },
  INTERNAL: {
    name: 'Ký nội bộ',
    apiBaseUrl: '',
    enabled: true,
    authType: 'api_key',
    endpoints: {
      sign: '/api/signature/internal/sign',
      verify: '/api/signature/internal/verify',
    },
  },
}

/**
 * Get enabled providers
 */
export function getEnabledProviders(): CAProviderConfig[] {
  return Object.values(CA_PROVIDERS).filter((provider) => provider.enabled)
}

/**
 * Get provider config by name
 */
export function getProviderConfig(providerName: string): CAProviderConfig | null {
  return CA_PROVIDERS[providerName.toUpperCase()] || null
}

