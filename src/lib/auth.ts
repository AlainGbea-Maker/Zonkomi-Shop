import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'zonkomi-shop-secret-key-2024'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}
