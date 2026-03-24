import mongoose, { Model, Schema } from 'mongoose'

export interface IProduct {
  name: string
  description: string
  price: number
  images: string[]
  stock: number
  category: string
  featured: boolean
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    category: { type: String, default: 'General' },
    featured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'products',
  }
)

const Product = (mongoose.models.Product as Model<IProduct>) || mongoose.model<IProduct>('Product', ProductSchema)

export default Product
