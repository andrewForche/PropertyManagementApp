export interface ServiceResult<TData> {
  data: TData | null
  errorMessage: string | null
}
