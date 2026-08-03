// Auth Yup Validation Schemas (pairs with backend/validators/authValidators.js)

import * as Yup from "yup";

// ─── LOGIN SCHEMA ─────────────────────────────────────────────────────────────
export const loginValidationSchema = Yup.object({
  email: Yup.string()
    .trim()
    .lowercase()
    .email("Please enter a valid email address")
    .required("Email address is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

// ─── CUSTOMER REGISTRATION SCHEMA ──────────────────────────────────────────────
export const customerRegisterValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(3, "Full name must be at least 3 characters")
    .required("Full name is required"),
  phone: Yup.string()
    .trim()
    .matches(/^(\+91[\-\s]?)?\d{10}$/, "Please enter a valid 10-digit mobile number")
    .required("Phone number is required"),
  email: Yup.string()
    .trim()
    .lowercase()
    .email("Please enter a valid email address")
    .required("Email address is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

// ─── DRIVER REGISTRATION SCHEMA ────────────────────────────────────────────────
export const driverRegisterValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(3, "Full name must be at least 3 characters")
    .required("Full name is required"),
  phone: Yup.string()
    .trim()
    .matches(/^(\+91[\-\s]?)?\d{10}$/, "Please enter a valid 10-digit mobile number")
    .required("Phone number is required"),
  email: Yup.string()
    .trim()
    .lowercase()
    .email("Please enter a valid email address")
    .required("Email address is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
  vehicleType: Yup.string()
    .oneOf(["Bike", "Scooter"], "Vehicle type must be Bike or Scooter")
    .required("Vehicle type is required"),
  vehicleNumber: Yup.string()
    .trim()
    .min(3, "Please enter a valid vehicle registration number")
    .required("Vehicle registration number is required"),
  licenseNumber: Yup.string()
    .trim()
    .min(3, "Please enter a valid driving license number")
    .required("Driving license number is required"),
});

// ─── STORE REGISTRATION SCHEMA ────────────────────────────────────────────────
export const storeRegisterValidationSchema = Yup.object({
  storeName: Yup.string()
    .trim()
    .min(2, "Store name must be at least 2 characters")
    .required("Store name is required"),
  ownerName: Yup.string()
    .trim()
    .min(3, "Owner name must be at least 3 characters")
    .required("Owner name is required"),
  address: Yup.string()
    .trim()
    .min(5, "Please enter your complete store address")
    .required("Store address is required"),
  pincode: Yup.string()
    .trim()
    .matches(/^\d{6}$/, "Please enter a valid 6-digit pincode")
    .required("Pincode is required"),
  email: Yup.string()
    .trim()
    .lowercase()
    .email("Please enter a valid email address")
    .required("Email address is required"),
  phone: Yup.string()
    .trim()
    .matches(/^(\+91[\-\s]?)?\d{10}$/, "Please enter a valid 10-digit mobile number")
    .required("Phone number is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});
