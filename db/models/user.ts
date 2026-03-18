import mongoose, { Model, Schema } from 'mongoose'

export interface IUser {
  name: string
  email: string
  passwordHash: string
  role: 'customer' | 'admin'
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
)

const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema)

export default User
