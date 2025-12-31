import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { type MiniAppWalletAuthSuccessPayload, verifySiweMessage } from "@worldcoin/minikit-js"

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload
  nonce: string
}

export const POST = async (req: NextRequest) => {
  const { payload, nonce } = (await req.json()) as IRequestPayload
  const cookieStore = await cookies()
  const storedNonce = cookieStore.get("siwe")?.value

  if (nonce !== storedNonce) {
    return NextResponse.json({
      status: "error",
      isValid: false,
      message: "Invalid nonce",
    })
  }

  try {
    const validMessage = await verifySiweMessage(payload, nonce)
    return NextResponse.json({
      status: "success",
      isValid: validMessage.isValid,
      address: payload.address,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      isValid: false,
      message: error.message,
    })
  }
}
