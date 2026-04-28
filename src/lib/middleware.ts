import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, type JwtPayload } from '@/lib/auth-lite'

export interface AuthRequest extends NextRequest {
  user?: JwtPayload
}

export async function withAuth(
  request: NextRequest,
  handler: (req: AuthRequest, payload: JwtPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in.' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)

  if (!payload) {
    return NextResponse.json(
      { error: 'Session expired. Please sign in again.' },
      { status: 401 }
    )
  }

  const authedRequest = request as AuthRequest
  authedRequest.user = payload
  return handler(authedRequest, payload)
}

export async function withAdmin(
  request: NextRequest,
  handler: (req: AuthRequest, payload: JwtPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req, payload) => {
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      )
    }
    return handler(req, payload)
  })
}

export function optionalAuth(
  request: NextRequest
): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}
