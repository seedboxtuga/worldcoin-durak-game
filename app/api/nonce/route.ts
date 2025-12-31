import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  // Generate a random alphanumeric nonce (at least 8 characters)
  const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 32)

  // Store in secure HTTP-only cookie
  const cookieStore = await cookies()
  cookieStore.set("siwe", nonce, {
    secure: true,
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 10, // 10 minutes
  })

  return NextResponse.json({ nonce })
}
