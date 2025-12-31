import { type NextRequest, NextResponse } from "next/server"
import { verifyCloudProof, type IVerifyResponse, type ISuccessResult } from "@worldcoin/minikit-js"

interface IRequestPayload {
  payload: ISuccessResult
  action: string
  signal?: string
}

export async function POST(req: NextRequest) {
  const { payload, action, signal } = (await req.json()) as IRequestPayload
  const app_id = process.env.APP_ID as `app_${string}`

  if (!app_id) {
    return NextResponse.json({
      status: "error",
      isValid: false,
      message: "APP_ID is not configured",
    })
  }

  try {
    const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse

    if (verifyRes.success) {
      return NextResponse.json({
        status: 200,
        isValid: true,
        verifyRes,
      })
    } else {
      return NextResponse.json({
        status: 400,
        isValid: false,
        verifyRes,
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      isValid: false,
      message: error.message,
    })
  }
}
