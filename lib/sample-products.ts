import type { Locale } from '@/lib/i18n'
import { translateProductDescription as translateDescriptionFromI18n } from '@/lib/i18n'

export type SampleProduct = {
  seedKey: string
  name: string
  description: string
  price: number
  images: string[]
  stock: number
  category: 'Accessories' | 'Audio' | 'Bags' | 'General' | 'Home' | 'Kitchen' | 'Shoes' | 'Travel'
  featured: boolean
}

// Sample seed data has been intentionally removed. This file remains only as a
// compatibility layer for existing imports while stale seeded products are cleaned up.
export const sampleProducts: SampleProduct[] = []

export const seedProducts: SampleProduct[] = []

export const deprecatedSampleProductNames = [
  'Everyday Canvas Tote',
  'Minimal Desk Lamp',
  'Cloud Runner Sneakers',
  'Stoneware Mug Set',
  'Studio Headphones',
  'Heritage Wristwatch',
  'Indoor Plant Stand',
  'Pour-Over Coffee Kit',
  'Weekend Duffel',
  'Wool Lounge Blanket',
  'Commuter Backpack',
  'Ceramic Serving Bowl',
  'Linen Table Runner',
  'Trail Flask Bottle',
  'Everyday Knit Beanie',
  'Motion Bluetooth Speaker',
  'Cedar Cutting Board',
  'Nomad Passport Holder',
  'Slip-On City Loafers',
  'Matte Water Bottle',
  'Desk Organizer Tray',
  'Noise-Isolating Earbuds',
  'Soft Stripe Bath Towel',
  'Carry-On Packing Cubes',
  'Leather Card Wallet',
  'Everyday Chef Knife',
  'Harbor Windbreaker',
  'Canvas Apron',
  'Compact Yoga Mat',
  'Orbit Alarm Clock',
  'Metro Crossbody Pouch',
  'Glass Meal Prep Box',
  'Linen Floor Cushion',
  'Pace Training Shorts',
  'Summit Lace Boots',
] as const

export function translateProductName(name: string, _locale: Locale) {
  return name
}

export function translateProductDescription(description: string, locale: Locale) {
  return translateDescriptionFromI18n(description, locale)
}
