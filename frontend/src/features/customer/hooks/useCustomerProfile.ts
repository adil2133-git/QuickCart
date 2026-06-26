// hooks/useCustomerProfile.ts
import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios"; // ← adjust to your actual axios instance path
import { useCustomerProfileStore } from "../state/customerProfileState";
import { useAuthStore } from "../../../features/auth/state/authState"; // ← adjust to your actual auth store path
import type { AddAddressPayload } from "../types/customerProfile";

export const useCustomerProfile = () => {
  const navigate = useNavigate();
  const {
    profile,
    isLoading,
    error,
    setProfile,
    setLoading,
    setError,
    addAddress,
    removeAddress,
    setDefaultAddressLocal,
    clearProfile,
  } = useCustomerProfileStore();

  const clearUser = useAuthStore((s) => s.clearUser);
  const user = useAuthStore((s) => s.user);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/customer/profile");
      setProfile(res.data.profile);
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [setProfile, setLoading, setError]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const addNewAddress = useCallback(
    async (payload: AddAddressPayload) => {
      const res = await api.post("/customer/address", payload);
      addAddress(res.data.address, res.data.defaultAddress);
    },
    [addAddress]
  );

  const setDefault = useCallback(
    async (id: string) => {
      await api.patch(`/customer/address/${id}/default`);
      setDefaultAddressLocal(id);
    },
    [setDefaultAddressLocal]
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      const res = await api.delete(`/customer/address/${id}`);
      removeAddress(id, res.data.defaultAddress);
    },
    [removeAddress]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearUser();
      clearProfile();
      navigate("/login");
    }
  }, [clearUser, clearProfile, navigate]);

  return {
    profile,
    user,
    isLoading,
    error,
    addNewAddress,
    setDefault,
    deleteAddress,
    logout,
  };
};