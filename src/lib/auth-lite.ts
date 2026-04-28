// Minimal auth module using Node.js crypto (no external JWT library needed)
// Implements HS256 JWT signing and verification with the built-in crypto module

import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'zonkomi-shop-secret-key-2024'
const JWT_EXPIRY = '7d'

// Base64URL encoding/decoding helpers
function base64urlEncode(data: string): string {
  return Buffer.from(data).toString('base64url')
}

function base64urlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf-8')
}

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export function signToken(payload: JwtPayload): string {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const exp = now + (7 * 24 * 60 * 60) // 7 days in seconds
  const body = base64urlEncode(JSON.stringify({ ...payload, iat: now, exp }))

  const signatureInput = `${header}.${body}`
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64url')

  return `${header}.${body}.${signature}`
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, body, signature] = parts

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url')

    if (signature !== expectedSignature) return null

    // Decode payload
    const decoded = JSON.parse(base64urlDecode(body))

    // Check expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null

    // Return only the expected fields
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }
  } catch {
    return null
  }
}
