import { API_URL } from "@/utils/constants";
import axios from "axios";

export class ApiHandler {
  static async sendAuthRequest(url: string, data: any, signal?: AbortSignal) {
    try {
      const response = await axios.post(API_URL + url, data, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
        signal
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async sendUnauthenticatedGetRequest(url: string) {
    try {
      const response = await axios.get(API_URL + url, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async sendUnauthenticatedPostRequest(url: string, data: any) {
    try {
      const response = await axios.post(API_URL + url, data, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async sendGetRequest(url: string, accessToken: string) {
    try {
      const response = await axios.get(API_URL + url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        withCredentials: true
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async sendPostRequest(url: string, data: any, accessToken: string, hasFile = false) {
    try {
      const response = await axios.post(API_URL + url, data, {
        headers: {
          "Content-Type": hasFile ? "multipart/form-data" : "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        withCredentials: true
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async sendPatchRequest(url: string, data: any, accessToken: string, hasFile = false) {
    try {
      const response = await axios.patch(API_URL + url, data, {
        headers: {
          "Content-Type": hasFile ? "multipart/form-data" : "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        withCredentials: true
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async sendDeleteRequest(url: string, accessToken: string) {
    try {
      const response = await axios.delete(API_URL + url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        withCredentials: true
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async sendGetExportRequest(url: string, accessToken: string) {
    try {
      const response = await axios.get(API_URL + url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        withCredentials: true,
        responseType: "blob"
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async sendPostExportRequest(url: string, data: any, accessToken: string) {
    try {
      const response = await axios.post(API_URL + url, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        withCredentials: true,
        responseType: "blob"
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}
