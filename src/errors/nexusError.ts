import axios, { AxiosError } from "axios";
export const showError = (error: AxiosError<{ message: string }> | any, customMsg?:string) => {
  alert(
    error?.response?.data?.message || error?.message || customMsg,
  );
};
export const nexusError = (error: AxiosError<{ message: string }> | any) => {
  return error?.response?.data?.message
}

export const isNexusError = (error:unknown) => {
  return axios.isAxiosError(error)
}

export const isNexusStatus = (error:unknown, status: Number) => {
  if (isNexusError(error)) return error.response?.status === status
}

export const notNexusError =(error:unknown) => {
  return !axios.isAxiosError(error)
}

export const notNexusStatus = (error: unknown, status: Number) => {
  return notNexusError(error) || (isNexusError(error) && error.response?.status !== status);
}
