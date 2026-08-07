-- Migration to update size_mm column in products table to support decimal/float values (e.g. 55.5)
ALTER TABLE public.products ALTER COLUMN size_mm TYPE NUMERIC(5,2);
