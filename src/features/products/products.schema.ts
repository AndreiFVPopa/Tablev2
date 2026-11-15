import { z } from "zod";

import { PRODUCT_CATEGORIES, PRODUCT_TAGS } from "./products.constants";

const productCategorySchema = z.enum([
  PRODUCT_CATEGORIES.ELECTRONICE,
  PRODUCT_CATEGORIES.IMBRACAMINTE,
  PRODUCT_CATEGORIES.CASA,
  PRODUCT_CATEGORIES.SPORT,
]);

const productTagSchema = z.enum([
  PRODUCT_TAGS.PROMO,
  PRODUCT_TAGS.NOU,
  PRODUCT_TAGS.ECO,
  PRODUCT_TAGS.PREMIUM,
]);

export const productSchema = z
  .object({
    id: z.string().min(1).meta({ title: "ID" }),
    title: z.string().min(2).max(100).meta({ title: "Titlu" }),
    sku: z.string().min(3).max(32).meta({ title: "SKU" }),
    price: z.number().min(0).meta({ title: "Preț" }),
    stock: z.number().int().min(0).meta({ title: "Stoc" }),
    category: productCategorySchema.meta({ title: "Categorie" }),
    available: z.boolean().meta({ title: "Disponibil" }),
    listedAt: z.coerce.date().meta({ title: "Listat" }),
    tags: z.array(productTagSchema).meta({ title: "Etichete" }),
    supplier: z
      .object({
        name: z.string().min(2).meta({ title: "Nume" }),
        country: z.string().min(2).meta({ title: "Țară" }),
      })
      .meta({ title: "Furnizor" }),
    discontinuedAt: z.coerce.date().nullable().optional().meta({ title: "Retras" }),
  })
  .meta({ title: "Produs" });

export const productsDatasetSchema = z.array(productSchema);
