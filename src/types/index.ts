export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  status: AdminStatus;
  storeName?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: ProductCategory;
  images: string[];
  stockQty?: number;
  sku: string;
  status: ProductStatus;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  orderNotes?: string;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  orderItems: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  REGULAR = 'REGULAR',
}

export enum AdminStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ProductCategory {
  SMARTPHONES = 'SMARTPHONES',
  LAPTOPS = 'LAPTOPS',
  TABLETS = 'TABLETS',
  ACCESSORIES = 'ACCESSORIES',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export enum PaymentMethod {
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ECOCASH = 'ECOCASH',
  PAYPAL = 'PAYPAL',
  PAYNOW = 'PAYNOW',
  INNBUCKS = 'INNBUCKS',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum OrderStatus {
  PLACED = 'PLACED',
  PAYMENT_NOT_DONE = 'PAYMENT_NOT_DONE',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  FULFILLED = 'FULFILLED',
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface CheckoutForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  orderNotes?: string;
  paymentMethod: PaymentMethod;
}

export interface AdminRegistration {
  name: string;
  email: string;
  password: string;
  storeName: string;
  bio: string;
}