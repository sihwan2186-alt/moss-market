import mongoose, { Model, Schema, Types } from 'mongoose'

export interface IPasswordResetToken {
  userId: Types.ObjectId
  email: string
  tokenHash: string
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'passwordResetTokens',
  }
)

PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const PasswordResetToken =
  (mongoose.models.PasswordResetToken as Model<IPasswordResetToken>) ||
  mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema)

export default PasswordResetToken
