import { z } from "zod";

const fileSchema = z.instanceof(File).refine(file => file.size > 0, {
    message: 'A file must be uploaded'
})

export const createProductSchema = z.object({
  name: z.string({ error: "Name of product is required" }),

  description: z.string({ error: "Description is required" })
    .min(10, { error: "Description must be at least 10 characters" }),

  // Replaced coerce with pipe approach
  price: z.union([z.number(), z.string()])
    .transform((val) => Number(val))
    .pipe(
      z.number({ error: "Price is required" })
        .min(100, { error: "Price must be at least $1.00" })
    ),

  type: z.string({ error: "Type is required" }),

  brand: z.string({ error: "Brand is required" }),

  // Replaced coerce with pipe approach
  quantityInStock: z.union([z.number(), z.string()])
    .transform((val) => Number(val))
    .pipe(
      z.number({ error: "Quantity is required" })
        .min(1, { error: "Quantity must be at least 1" })
    ),
  pictureUrl: z.string().optional(), 
  file:  fileSchema.optional()
  }).refine((data) => data.pictureUrl || data.file, {
    message: 'Please provide an image',
    path: ['file']
});

export type CreateProductSchema = z.infer<typeof createProductSchema>;

// Optional
export type CreateProductInput = z.input<typeof createProductSchema>;