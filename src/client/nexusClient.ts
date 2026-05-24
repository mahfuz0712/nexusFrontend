// import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
// import { nexusError } from "../errors/nexusError";
// import { SuccessResponse, ErrorResponse } from "../types/response.types";

// export interface NexusClientConfig extends AxiosRequestConfig {
//   baseURL: string;
// }

// export interface NexusClient {
//   get<T = any>(url: string, config?: AxiosRequestConfig): Promise<SuccessResponse<T>>;
//   post<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<SuccessResponse<T>>;
//   put<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<SuccessResponse<T>>;
//   patch<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<SuccessResponse<T>>;
//   delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<SuccessResponse<T>>;
//   setAuthToken(token: string): void;
//   clearAuthToken(): void;
//   instance: AxiosInstance;
// }

// function buildAxiosInstance(config: NexusClientConfig): AxiosInstance {
//   const client = axios.create(config);

//   client.interceptors.response.use(
//     (response) => {
//       const body = response.data as SuccessResponse;

//       if (body && body.success === true) {
//         return body as any;
//       }

//       return response;
//     },
//     (error) => {
//       if (axios.isAxiosError(error) && error.response) {
//         const body = error.response.data as ErrorResponse;

//         throw new exusError(
//           body?.message ?? "An unexpected error occurred",
//           error.response.status,
//           body?.errors
//         );
//       }

//       throw new NexusError(error.message ?? "Network error", 0);
//     }
//   );

//   return client;
// }

// export function createNexusClient(config: NexusClientConfig): NexusClient {
//   const axiosInstance = buildAxiosInstance(config);

//   return {
//     instance: axiosInstance,

//     get<T>(url: string, config?: AxiosRequestConfig) {
//       return axiosInstance.get<T>(url, config) as unknown as Promise<SuccessResponse<T>>;
//     },

//     post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
//       return axiosInstance.post<T>(url, data, config) as unknown as Promise<SuccessResponse<T>>;
//     },

//     put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
//       return axiosInstance.put<T>(url, data, config) as unknown as Promise<SuccessResponse<T>>;
//     },

//     patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
//       return axiosInstance.patch<T>(url, data, config) as unknown as Promise<SuccessResponse<T>>;
//     },

//     delete<T>(url: string, config?: AxiosRequestConfig) {
//       return axiosInstance.delete<T>(url, config) as unknown as Promise<SuccessResponse<T>>;
//     },

//     setAuthToken(token: string) {
//       axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//     },

//     clearAuthToken() {
//       delete axiosInstance.defaults.headers.common["Authorization"];
//     },
//   };
// }