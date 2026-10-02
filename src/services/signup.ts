import { baseUrl, type PublicGroup } from "./publicGroups";

export type FieldValue = string | number | boolean | string[] | null;
export interface SignupField {
  id: number | string;
  type: string;
  name: string;
  label: string;
  fieldTypeCode: string;
  mandatory: boolean;
  sortKey: number;
  default?: FieldValue;
  options?: { id: string | number; name: string }[] | null;
  length?: number | null;
  readonly?: boolean;
  note?: string;
}
export interface SignupForm {
  token: string;
  group: PublicGroup;
  form: SignupField[];
  email?: string | null;
  requesterId?: number | null;
  signUpPersons?: {
    person: { domainIdentifier: string; title: string };
    status: string;
    hasAcceptedPrivacy?: boolean;
    formData?: { name: string; value: FieldValue }[];
  }[];
  acceptPrivacyForSelfForm?: SignupField[] | null;
}
export interface SignupResult {
  verificationNotice?: boolean;
  verificationEmail?: string | null;
  groupHomepageHash?: string;
}
export class SignupError extends Error {
  status: number;
  fields: { fieldId: string; message?: string }[];
  constructor(
    message: string,
    status: number,
    fields: { fieldId: string; message?: string }[] = [],
  ) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
export const fieldKey = (field: SignupField) => `${field.type}_${field.id}`;
export function signupStatus(group: PublicGroup) {
  const c = group.signUpConditions;
  const open = c?.canSignUp ?? group.canSignUp;
  const waiting = !!(
    c?.groupAllowsWaitinglist &&
    (c.groupHasSpaceForRequests === false ||
      (group.requestedWaitinglistSeatsCount ?? 0) > 0)
  );
  let reason = "Für dieses Team ist aktuell keine Anmeldung möglich.";
  if (c?.endDateNotPassed === false)
    reason = "Die Anmeldefrist ist abgelaufen.";
  else if (c?.groupIsActive === false || c?.groupIsOpenForMembers === false)
    reason = "Die Anmeldung für dieses Team ist derzeit geschlossen.";
  else if (c?.groupIsNotFull === false || c?.groupHasSpaceForRequests === false)
    reason =
      "Dieses Team ist bereits voll. Aktuell sind keine weiteren Anmeldungen möglich.";
  return { open, waiting, reason, application: group.autoAccept === false };
}
export function initialValues(
  fields: SignupField[],
  personData: { name: string; value: FieldValue }[] = [],
) {
  return Object.fromEntries(
    fields.map((field) => {
      const value =
        personData.find((item) => item.name === field.name)?.value ??
        field.default;
      return [
        fieldKey(field),
        value ??
          (field.fieldTypeCode === "checkbox"
            ? false
            : field.fieldTypeCode === "multiselect"
              ? []
              : ""),
      ];
    }),
  );
}
export function signupPayload(
  token: string,
  fields: SignupField[],
  values: Record<string, FieldValue>,
  personId: number | null = null,
) {
  return {
    token,
    forms: [
      {
        personId,
        form: fields.map((field) => ({
          id: String(field.id),
          type: field.type,
          value:
            values[fieldKey(field)] === "" ||
            values[fieldKey(field)] === undefined
              ? null
              : values[fieldKey(field)],
        })),
      },
    ],
  };
}
const apiOrigin =
  import.meta.env.DEV && import.meta.env.VITE_BASE_URL ? "" : baseUrl;
async function request<T>(
  path: string,
  signal?: AbortSignal,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiOrigin}/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      credentials: "omit",
      signal,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    throw new SignupError(
      "Die Verbindung ist unterbrochen. Bitte versuche es erneut.",
      0,
    );
  }
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new SignupError(
      result?.translatedMessage ||
        (response.status === 404
          ? "Dieser Anmeldelink ist ungültig oder abgelaufen. Bitte starte die Anmeldung erneut."
          : "Die Anmeldung konnte nicht verarbeitet werden. Bitte prüfe deine Angaben."),
      response.status,
      result?.errors ?? [],
    );
  if (result === null)
    throw new SignupError(
      "ChurchTools hat keine gültige Antwort geliefert.",
      502,
    );
  return result.data ?? result;
}
export function requestSignupToken(
  id: number,
  hash: string,
  signal?: AbortSignal,
  email?: string,
  signUpUrlTemplate?: string,
) {
  return request<{ token?: string; success?: string }>(
    `/publicgroups/${id}/token`,
    signal,
    {
      clicked: [],
      groupHomepageHash: hash,
      ...(email ? { email, signUpUrlTemplate } : {}),
    },
  );
}
export async function loadSignupForm(
  id: number,
  token: string,
  signal?: AbortSignal,
) {
  const result = await request<SignupForm>(
    `/publicgroups/${id}/form?token=${encodeURIComponent(token)}`,
    signal,
  );
  if (
    !result ||
    !Array.isArray(result.form) ||
    Number(result.group?.id) !== id ||
    !result.form.every(
      (field) =>
        field.id !== undefined &&
        typeof field.type === "string" &&
        typeof field.label === "string" &&
        typeof field.fieldTypeCode === "string",
    )
  )
    throw new SignupError(
      "Die Formularinformationen sind unvollständig. Bitte lade die Seite erneut.",
      502,
    );
  return result;
}
export function submitSignup(
  id: number,
  payload: ReturnType<typeof signupPayload>,
  signal?: AbortSignal,
) {
  return request<SignupResult>(`/publicgroups/${id}/signup`, signal, payload);
}
