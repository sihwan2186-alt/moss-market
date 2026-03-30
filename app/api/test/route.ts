import { NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import User from '@/db/models/user'
import { getAuthUser } from '@/lib/session'

export async function GET() {
  const authUser = await getAuthUser()
  const includeDiagnostics = process.env.NODE_ENV !== 'production' || authUser?.role === 'admin'

  try {
    const connection = await dbConnect()
    const userCount = includeDiagnostics ? await User.countDocuments() : undefined

    return NextResponse.json(
      includeDiagnostics
        ? {
            ok: true,
            message: 'MongoDB connection successful.',
            database: connection.name,
            host: connection.host,
            readyState: connection.readyState,
            collections: {
              users: userCount ?? 0,
            },
          }
        : {
            ok: true,
            message: 'MongoDB connection successful.',
          },
      { status: 200 }
    )
  } catch (error) {
    console.error('[health-check]', error)

    return NextResponse.json(
      includeDiagnostics
        ? {
            ok: false,
            message: 'MongoDB connection failed.',
            hint: 'Detailed diagnostics are available in the server logs.',
          }
        : {
            ok: false,
            message: 'MongoDB connection failed.',
          },
      { status: 500 }
    )
  }
}
