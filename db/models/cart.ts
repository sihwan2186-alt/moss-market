import mongoose, { Model, Schema, Types } from 'mongoose'

export interface ICartItem {
  productId: Types.ObjectId
  quantity: number
}

export interface ICart {
  userId: Types.ObjectId
  items: ICartItem[]
  createdAt: Date
  updatedAt: Date
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [CartItemSchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'carts',
  }
)

const Cart = (mongoose.models.Cart as Model<ICart>) || mongoose.model<ICart>('Cart', CartSchema)

export default Cart
