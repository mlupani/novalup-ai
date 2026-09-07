import {
  Camera,
  FileText,
  GraduationCap,
  Mic,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { PRODUCT_PHOTOS_URL } from "@/lib/constants";

export type ProductStatus = "available" | "coming-soon";

export interface Product {
  slug: string;
  href: string;
  status: ProductStatus;
  icon: LucideIcon;
  category: string;
  featured?: boolean;
}

export const products: Product[] = [
  {
    slug: "product-photos",
    href: PRODUCT_PHOTOS_URL,
    status: "available",
    icon: Camera,
    category: "creative",
    featured: true,
  },
  {
    slug: "cv-analyzer",
    href: "/cv",
    status: "coming-soon",
    icon: FileText,
    category: "career",
  },
  {
    slug: "study-assistant",
    href: "/study",
    status: "coming-soon",
    icon: GraduationCap,
    category: "learning",
  },
  {
    slug: "interview-simulator",
    href: "/interview",
    status: "coming-soon",
    icon: Mic,
    category: "career",
  },
  {
    slug: "trading-analytics",
    href: "/trading",
    status: "coming-soon",
    icon: LineChart,
    category: "finance",
  },
];
