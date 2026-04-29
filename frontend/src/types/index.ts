export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'customer' | 'vendor' | 'admin';
  avatar: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface Vendor {
  id: number;
  shop_name: string;
  slug: string;
  description: string;
  logo: string | null;
  banner: string | null;
  status: string;
  rating: number;
  total_sales: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  effective_price: number;
  stock: number;
  rating: number;
  review_count: number;
  vendor: Vendor;
  images: ProductImage[];
  category: Category;
  is_featured: boolean;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
