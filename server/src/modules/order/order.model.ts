import mongoose, { type Document, type Types } from 'mongoose'
import { ORDER_STATUS, PAYMENT_STATUS } from '../../../../src/shared/constants/index.js'

export interface IOrderAddressDoc {
  fullName:   string
  phone:      string
  country:    string
  state:      string
  city:       string
  street:     string
  postalCode: string
}

export interface IOrderItemDoc {
  productId:  Types.ObjectId
  title:      string
  image?:     string
  sku:        string
  quantity:   number
  itemPrice:  number
  lineTotal:  number
}

export interface IOrderDocument extends Document {
  orderNumber:        string
  userId:             Types.ObjectId
  checkoutSessionId?: Types.ObjectId
  items:              IOrderItemDoc[]
  shippingAddress:    IOrderAddressDoc
  billingAddress?:    IOrderAddressDoc
  sameAsShipping:     boolean
  shippingMethod:     'standard' | 'express' | 'sameDay'
  subtotal:           number
  discountAmount:     number
  shippingFee:        number
  taxAmount:          number
  grandTotal:         number
  couponCode?:        string
  paymentStatus:      'pending' | 'paid' | 'failed' | 'refunded'
  orderStatus:        'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  paymentIntentId?:   string
  notes?:             string
  createdAt:          Date
  updatedAt:          Date
}

const addressSchema = new mongoose.Schema<IOrderAddressDoc>(
  {
    fullName:   { type: String, required: true, trim: true },
    phone:      { type: String, required: true, trim: true },
    country:    { type: String, required: true, trim: true },
    state:      { type: String, required: true, trim: true },
    city:       { type: String, required: true, trim: true },
    street:     { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const orderItemSchema = new mongoose.Schema<IOrderItemDoc>(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title:     { type: String, required: true, trim: true },
    image:     { type: String },
    sku:       { type: String, required: true, trim: true },
    quantity:  { type: Number, required: true, min: 1 },
    itemPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema<IOrderDocument>(
  {
    orderNumber:        { type: String, required: true, unique: true, index: true },
    userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    checkoutSessionId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Checkout' },
    items:              { type: [orderItemSchema], required: true },
    shippingAddress:    { type: addressSchema, required: true },
    billingAddress:     { type: addressSchema },
    sameAsShipping:     { type: Boolean, default: true },
    shippingMethod:     { type: String, enum: ['standard', 'express', 'sameDay'], default: 'standard' },
    subtotal:           { type: Number, required: true, min: 0 },
    discountAmount:     { type: Number, default: 0, min: 0 },
    shippingFee:        { type: Number, default: 0, min: 0 },
    taxAmount:          { type: Number, default: 0, min: 0 },
    grandTotal:         { type: Number, required: true, min: 0 },
    couponCode:         { type: String, trim: true, uppercase: true },
    paymentStatus:      { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING, index: true },
    orderStatus:        { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING, index: true },
    paymentIntentId:    { type: String },
    notes:              { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => { delete ret.__v; return ret },
    },
  },
)

orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ paymentIntentId: 1 }, { sparse: true })

export const Order = mongoose.model<IOrderDocument>('Order', orderSchema)
