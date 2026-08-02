/**
 * QuickCart Auth Zod Validation Schemas
 * 
 * CROSS-REFERENCE NOTE:
 * Frontend counterparts are defined in:
 * `frontend/src/features/auth/validation/authSchemas.ts`
 * Always update both files in tandem when modifying validation rules.
 */

const { z } = require("zod");

// ─── LOGIN SCHEMA ─────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string({ required_error: "Email address is required" })
    .trim()
    .toLowerCase()
    .email({ message: "Please enter a valid email address" }),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
});

// ─── CUSTOMER REGISTRATION SCHEMA ──────────────────────────────────────────────
const customerRegisterSchema = z.object({
  name: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(3, { message: "Full name must be at least 3 characters" }),
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .regex(/^\d{10}$/, { message: "Please enter a valid 10-digit mobile number" }),
  email: z
    .string({ required_error: "Email address is required" })
    .trim()
    .toLowerCase()
    .email({ message: "Please enter a valid email address" }),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
});

// ─── DRIVER REGISTRATION SCHEMA ────────────────────────────────────────────────
const driverRegisterSchema = z
  .object({
    name: z
      .string({ required_error: "Full name is required" })
      .trim()
      .min(3, { message: "Full name must be at least 3 characters" }),
    phone: z
      .string({ required_error: "Phone number is required" })
      .trim()
      .regex(/^\d{10}$/, { message: "Please enter a valid 10-digit mobile number" }),
    email: z
      .string({ required_error: "Email address is required" })
      .trim()
      .toLowerCase()
      .email({ message: "Please enter a valid email address" }),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string({ required_error: "Please confirm your password" }),
    vehicleType: z.enum(["Bike", "Scooter"], {
      errorMap: () => ({ message: "Vehicle type must be Bike or Scooter" }),
    }),
    vehicleNumber: z
      .string({ required_error: "Vehicle number is required" })
      .trim()
      .min(3, { message: "Please enter a valid vehicle registration number" }),
    licenseNumber: z
      .string({ required_error: "Driving license number is required" })
      .trim()
      .min(3, { message: "Please enter a valid driving license number" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── STORE REGISTRATION SCHEMA ────────────────────────────────────────────────
const storeRegisterSchema = z
  .object({
    storeName: z
      .string({ required_error: "Store name is required" })
      .trim()
      .min(2, { message: "Store name must be at least 2 characters" }),
    ownerName: z
      .string({ required_error: "Owner name is required" })
      .trim()
      .min(3, { message: "Owner name must be at least 3 characters" }),
    address: z
      .string({ required_error: "Store address is required" })
      .trim()
      .min(5, { message: "Please enter your complete store address" }),
    pincode: z
      .string({ required_error: "Pincode is required" })
      .trim()
      .regex(/^\d{6}$/, { message: "Please enter a valid 6-digit pincode" }),
    email: z
      .string({ required_error: "Email address is required" })
      .trim()
      .toLowerCase()
      .email({ message: "Please enter a valid email address" }),
    phone: z
      .string({ required_error: "Phone number is required" })
      .trim()
      .regex(/^\d{10}$/, { message: "Please enter a valid 10-digit mobile number" }),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string({ required_error: "Please confirm your password" }),
    lat: z
      .union([z.string(), z.number()])
      .refine((val) => !isNaN(parseFloat(val)), { message: "Store location on map is required" }),
    lng: z
      .union([z.string(), z.number()])
      .refine((val) => !isNaN(parseFloat(val)), { message: "Store location on map is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

module.exports = {
  loginSchema,
  customerRegisterSchema,
  driverRegisterSchema,
  storeRegisterSchema,
};
