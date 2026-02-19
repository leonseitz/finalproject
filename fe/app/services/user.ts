const API_URL = "http://127.0.0.1:8000/api";

export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const getUserProfile = async () => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch user profile");
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const updateUserProfile = async (data: any) => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/users/me`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Failed to update user profile");
    }

    return await res.json();
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};
