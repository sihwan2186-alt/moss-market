import mongoose, { Model, Schema, Types } from 'mongoose'

export interface IOrderItem {
  productId: Types.ObjectId
  name: string
  price: number
  quantity: number
  image: string
}

export interface IOrderRefundItem {
  itemIndex: number
  productId?: string
  name: string
  quantity: number
  amount: number
}

export interface IOrderRefund {
  id: string
  amount: number
  reason: string
  createdAt: Date
  items: IOrderRefundItem[]
}

export interface IOrder {
  userId: Types.ObjectId
  items: IOrderItem[]
  totalPrice: number
  status: 'pending' | 'paid' | 'cancelled'
  customerName: string
  contactEmail: string
  shippingAddress: {
    recipient: string
    line1: string
    line2: string
    city: string
    postalCode: string
    country: string
  } | null
  shippingStatus: 'preparing' | 'shipped'
  note: string
  paymentLast4: string
  refunds: IOrderRefund[]
  createdAt: Date
  updatedAt: Date
}

const ShippingAddressSchema = new Schema(
  {
    recipient: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false }
)

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

const OrderRefundItemSchema = new Schema<IOrderRefundItem>(
  {
    itemIndex: { type: Number, required: true, min: 0 },
    productId: { type: String, default: '', trim: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const OrderRefundSchema = new Schema<IOrderRefund>(
  {
    id: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, default: '', trim: true },
    createdAt: { type: Date, required: true },
    items: { type: [OrderRefundItemSchema], default: [] },
  },
  { _id: false }
)

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], default: [] },
    totalPrice: { type: Number, required: true, min: 0 },
    customerName: { type: String, default: '', trim: true },
    contactEmail: { type: String, default: '', trim: true, lowercase: true },
    shippingAddress: { type: ShippingAddressSchema, default: null },
    shippingStatus: {
      type: String,
      enum: ['preparing', 'shipped'],
      default: 'preparing',
    },
    note: { type: String, default: '', trim: true },
    paymentLast4: { type: String, default: '', trim: true },
    refunds: { type: [OrderRefundSchema], default: [] },
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
