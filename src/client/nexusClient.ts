import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { NexusError } from "../errors/nexusError";
import { SuccessResponse, ErrorResponse } from "../types/response.types";

export interface NexusClientConfig extends AxiosRequestConfig {
  baseURL: string;
}

/**
 * আসল AxiosInstance — কোনো নতুন behavior যোগ করা হয়নি।
 * শুধু get/post/put/patch/delete এর resolved value-টা
 * AxiosResponse<SuccessResponse<T>> হিসেবে retype করা হলো,
 * যাতে response.data সরাসরি backend এর successResponse() শেইপে typed হয়।
 */
export interface NexusInstance
  extends Omit<AxiosInstance, "get" | "post" | "put" | "patch" | "delete"> {
  get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<SuccessResponse<T>>>;

  post<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<SuccessResponse<T>>>;

  put<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<SuccessResponse<T>>>;

  patch<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<SuccessResponse<T>>>;

  delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<SuccessResponse<T>>>;
}

export function createNexusClient(config: NexusClientConfig): NexusInstance {
  const client = axios.create(config);

  // success কিছুই touch করবে না — খাঁটি axios behavior।
  // শুধু error কে nexus-backend এর ApiError শেইপ অনুযায়ী NexusError বানিয়ে throw করা হবে।
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error) && error.response) {
        const body = error.response.data as ErrorResponse;

        throw new NexusError(
          body?.message ?? "An unexpected error occurred",
          error.response.status,
          body?.errors
        );
      }

      throw new NexusError(error.message ?? "Network error", 0);
    }
  );

  return client as unknown as NexusInstance;
}