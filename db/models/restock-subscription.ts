import mongoose, { Model, Schema, Types } from 'mongoose'

export interface IRestockSubscription {
  productId: Types.ObjectId
  email: string
  userId?: Types.ObjectId
  status: 'pending' | 'notified'
  notifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const RestockSubscriptionSchema = new Schema<IRestockSubscription>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    status: { type: String, enum: ['pending', 'notified'], default: 'pending' },
    notifiedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'restockSubscriptions',
  }
)

RestockSubscriptionSchema.index(
  { productId: 1, email: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
)

const RestockSubscription =
  (mongoose.models.RestockSubscription as Model<IRestockSubscription>) ||
  mongoose.model<IRestockSubscription>('RestockSubscription', RestockSubscriptionSchema)

export default RestockSubscription
