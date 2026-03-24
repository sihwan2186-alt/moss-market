import mongoose, { Model, Schema, Types } from 'mongoose'

export interface IOrderItem {
  productId: Types.ObjectId
  name: string
  price: number
  quantity: number
  image: string
}

export interface IOrder {
  userId: Types.ObjectId
  items: IOrderItem[]
  totalPrice: number
  status: 'pending' | 'paid' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' },
  },
  { _id: false }
)

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], default: [] },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'paid',
    },
  },
  {
    timestamps: true,
    collection: 'orders',
  }
)

const Order = (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>('Order', OrderSchema)

export default Order
