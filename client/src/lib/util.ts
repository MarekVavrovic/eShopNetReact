import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { PaymentSummary, ShippingAddress } from "../app/models/order";

export function currencyFormat(amount: number) {
  return "£" + (amount / 100).toFixed(2);
}

export function filterEmptyValues(values: object) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) =>
        value !== "" &&
        value !== null &&
        value !== undefined &&
        value.length !== 0,
    ),
  );
}

export const formatAddressString = (address: ShippingAddress) => {
  return `${address?.name}, ${address?.line1}, ${address?.city}, ${address?.state}, 
            ${address?.postal_code}, ${address?.country}`;
};

export const formatPaymentString = (card: PaymentSummary) => {
  return `${card?.brand?.toUpperCase()}, **** **** **** ${card?.last4}, 
            Exp: ${card?.exp_month}/${card?.exp_year}`;
};

export function handleApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldNames: Path<T>[],
) {
  const apiError = error as { message?: string } | null | undefined;

  const errorMessage = apiError?.message ?? "";

  if (!errorMessage) return;

  const errorArray = errorMessage.split(",");

  errorArray.forEach((e) => {
    const trimmed = e.trim();
    if (!trimmed) return;

    const matchedField = fieldNames.find((fieldName) =>
      trimmed.toLowerCase().includes(fieldName.toString().toLowerCase()),
    );

    if (matchedField) {
      setError(matchedField, { message: trimmed });
    }
  });
}
