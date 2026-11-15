import type { productSchema } from "./products.schema";
import type { z } from "zod";

export type Product = z.output<typeof productSchema>;
export type ProductsDataset = readonly Product[];
