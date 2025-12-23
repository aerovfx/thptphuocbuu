/**
 * XSS Protection Utilities
 * 
 * Sanitize user input to prevent Cross-Site Scripting (XSS) attacks
 */

/**
 * Detect potentially dangerous HTML/script tags in content
 */
export function detectXssAttempt(content: string): {
    detected: boolean
    violations: string[]
} {
    const violations: string[] = []

    // Dangerous HTML tags
    const dangerousTags = [
        '<script',
        '</script>',
        '<iframe',
        '<embed',
        '<object',
        '<applet',
        '<meta',
        '<link',
        '<style',
        '<base',
        '<form',
        '<input',
        '<button',
        '<textarea',
        '<select',
        'javascript:',
        'onerror=',
        'onload=',
        'onclick=',
        'onmouseover=',
        'onfocus=',
        'onblur=',
        '<img',
        '<svg',
    ]

    const normalizedContent = content.toLowerCase()

    for (const tag of dangerousTags) {
        if (normalizedContent.includes(tag)) {
            violations.push(tag)
        }
    }

    // Check for HTML entities that could be dangerous
    const dangerousEntities = [
        '&lt;script',
        '&#60;script',
        '&#x3c;script',
        '&#x3C;script',
    ]

    for (const entity of dangerousEntities) {
        if (normalizedContent.includes(entity.toLowerCase())) {
            violations.push(entity)
        }
    }

    // Check for data URIs (can contain scripts)
    if (normalizedContent.includes('data:text/html') ||
        normalizedContent.includes('data:application')) {
        violations.push('data: URI')
    }

    return {
        detected: violations.length > 0,
        violations,
    }
}

/**
 * Sanitize HTML content by stripping all HTML tags
 * Preserves text content only
 */
export function stripHtmlTags(content: string): string {
    // Remove all HTML tags
    let sanitized = content.replace(/<[^>]*>/g, '')

    // Decode common HTML entities to prevent double-encoding issues
    sanitized = sanitized
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')

    // Remove any remaining script-like patterns
    sanitized = sanitized
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '') // Remove event handlers

    return sanitized.trim()
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(content: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
    }

    return content.replace(/[&<>"'/]/g, (char) => map[char] || char)
}

/**
 * Detect and block common XSS payloads
 */
export function detectCommonXssPayloads(content: string): boolean {
    const commonPayloads = [
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        /<img[^>]+src[^>]*>/gi,
        /<svg[^>]*>[\s\S]*?<\/svg>/gi,
        /javascript:\s*[^\s]*/gi,
        /on\w+\s*=\s*["'][^"']*["']/gi,
        /<iframe[^>]*>/gi,
        /<embed[^>]*>/gi,
        /<object[^>]*>/gi,
        /eval\s*\(/gi,
        /expression\s*\(/gi,
        /vbscript:/gi,
        /data:text\/html/gi,
    ]

    for (const pattern of commonPayloads) {
        if (pattern.test(content)) {
            return true
        }
    }

    return false
}

/**
 * Comprehensive XSS validation
 * Returns sanitized content or throws error if dangerous content detected
 */
export function validateAndSanitizeContent(content: string, options: {
    allowHtml?: boolean
    strict?: boolean
} = {}): {
    isValid: boolean
    sanitized: string
    violations: string[]
    message?: string
} {
    const { allowHtml = false, strict = true } = options

    // Check for XSS attempts
    const xssCheck = detectXssAttempt(content)

    if (xssCheck.detected) {
        return {
            isValid: false,
            sanitized: stripHtmlTags(content),
            violations: xssCheck.violations,
            message: 'Nội dung chứa mã HTML/JavaScript không được phép. Vui lòng chỉ nhập văn bản thuần.'
        }
    }

    // Check for common XSS payloads
    if (strict && detectCommonXssPayloads(content)) {
        return {
            isValid: false,
            sanitized: stripHtmlTags(content),
            violations: ['XSS payload detected'],
            message: 'Phát hiện mã độc hại. Nội dung đã bị chặn vì lý do bảo mật.'
        }
    }

    // If HTML not allowed, strip all tags
    const sanitized = allowHtml ? content : stripHtmlTags(content)

    return {
        isValid: true,
        sanitized,
        violations: [],
    }
}
