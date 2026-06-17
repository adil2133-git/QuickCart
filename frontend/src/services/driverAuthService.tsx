import api from "../api/axios";

export interface RegisterDriverPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  vehicleType: "Bike" | "Scooter";
  vehicleNumber: string;
  licenseNumber: string;
  drivingLicense: File | null;
  vehicleRC: File | null;
  profilePhoto: File | null;
}

export interface RegisterDriverResponse {
  success: boolean;
  message: string;
  email: string;
}

/**
 * Sends form data as multipart/form-data so multer/Cloudinary
 * middleware on the backend can receive the uploaded files.
 */
export async function registerDriver(
  payload: RegisterDriverPayload
): Promise<RegisterDriverResponse> {
  const form = new FormData();

  form.append("name", payload.name);
  form.append("phone", payload.phone);
  form.append("email", payload.email);
  form.append("password", payload.password);
  form.append("confirmPassword", payload.confirmPassword);
  form.append("vehicleType", payload.vehicleType);
  form.append("vehicleNumber", payload.vehicleNumber);
  form.append("licenseNumber", payload.licenseNumber);

  if (payload.drivingLicense) form.append("drivingLicense", payload.drivingLicense);
  if (payload.vehicleRC)       form.append("vehicleRC",       payload.vehicleRC);
  if (payload.profilePhoto)    form.append("profilePhoto",    payload.profilePhoto);

  const { data } = await api.post<RegisterDriverResponse>(
    "/auth/register/driver",
    form,
    // Let the browser set the multipart boundary automatically.
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return data;
}