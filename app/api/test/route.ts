import { NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import User from '@/db/models/user'

export async function GET() {
  try {
    const connection = await dbConnect()
    const userCount = await User.countDocuments()

    return NextResponse.json(
      {
        ok: true,
        message: 'MongoDB connection successful.',
        database: connection.name,
        host: connection.host,
        readyState: connection.readyState,
        collections: {
          users: userCount,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error'
    const hint = message.includes('querySrv')
      ? 'Your network or DNS is blocking MongoDB SRV lookups. Try using the standard MongoDB connection string from Atlas instead of mongodb+srv.'
      : undefined

    return NextResponse.json(
      {
        ok: false,
        message: 'MongoDB connection failed.',
        error: message,
        hint,
      },
      { status: 500 }
    )
  }
}
