import { useCallback, useState } from 'react';

/**
 * Small form state helper for the auth pages.
 *
 * Validation timing: a field shows its error after it loses focus with something in it (or after
 * a submit attempt), then updates live while the person types. Server field errors show at once
 * and clear as soon as that field changes.
 *
 * @param {{
 *   initialValues: Record<string, string>,
 *   validate: Record<string, (value: string, values: Record<string, string>) => string | null>,
 *   formRef: import("react").RefObject<HTMLFormElement | null>,
 * }} options validate keys also set the order used to focus the first invalid field;
 *   formRef points at the form so the hook can focus fields (the page owns the ref).
 */
export default function useAuthForm({ initialValues, validate, formRef }) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const clientError = (field, source = values) => validate[field]?.(source[field] ?? '', source) ?? null;

  const errorFor = (field) => {
    if (serverErrors[field]) return serverErrors[field];
    if (touched[field] || submitted) return clientError(field);
    return null;
  };

  const setValue = useCallback((field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const focusField = useCallback((field) => {
    const input = formRef.current?.querySelector(`[name="${field}"]`);
    if (input) {
      input.focus();
      if (typeof input.select === 'function' && input.type !== 'checkbox') input.select();
    }
  }, [formRef]);

  /** Shared props for a TextField bound to `field` (helperText is left to the page). */
  const fieldProps = (field) => ({
    name: field,
    value: values[field] ?? '',
    onChange: (event) => setValue(field, event.target.value),
    onBlur: () => {
      if (String(values[field] ?? '').length > 0) setTouched((current) => ({ ...current, [field]: true }));
    },
    error: Boolean(errorFor(field)),
  });

  /**
   * Marks the form as submitted and focuses the first invalid field.
   * @param {Record<string, string>} [source] values to check (defaults to the current state)
   * @returns {boolean} true when every field passes
   */
  const validateAll = (source = values) => {
    setSubmitted(true);
    const firstInvalid = Object.keys(validate).find((field) => clientError(field, source));
    if (firstInvalid) {
      focusField(firstInvalid);
      return false;
    }
    return true;
  };

  /** Applies ApiError.fieldErrors and focuses the first one. */
  const applyServerErrors = (fieldErrors) => {
    const entries = Object.entries(fieldErrors ?? {}).filter(([, message]) => message);
    if (entries.length === 0) return false;
    setServerErrors(Object.fromEntries(entries));
    const order = Object.keys(validate);
    const first = entries.map(([field]) => field).sort((a, b) => order.indexOf(a) - order.indexOf(b))[0];
    focusField(first);
    return true;
  };

  return {
    values,
    setValues,
    setValue,
    errorFor,
    fieldProps,
    validateAll,
    applyServerErrors,
    focusField,
  };
}
