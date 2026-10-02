import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { SignupField } from "./signup";
let api: typeof import("./signup");
beforeAll(async () => {
  vi.stubGlobal("window", {
    location: { origin: "https://example.church.tools" },
  });
  api = await import("./signup");
});
afterEach(() => vi.unstubAllGlobals());
const fields: SignupField[] = [
  {
    id: 2,
    type: "person",
    name: "firstName",
    label: "Vorname",
    fieldTypeCode: "text",
    sortKey: 0,
    mandatory: true,
  },
  {
    id: 2,
    type: "custom",
    name: "days",
    label: "Tage",
    fieldTypeCode: "multiselect",
    sortKey: 1,
    mandatory: false,
  },
  {
    id: -2,
    type: "privacy",
    name: "privacy",
    label: "Datenschutz",
    fieldTypeCode: "checkbox",
    default: false,
    sortKey: 2,
    mandatory: true,
  },
];
describe("single person signup", () => {
  it("keeps IDs unique by field type and preserves booleans, arrays, and empty values", () => {
    const values = api.initialValues(fields);
    expect(values).toEqual({ person_2: "", custom_2: [], "privacy_-2": false });
    values.custom_2 = ["a", "b"];
    values["privacy_-2"] = true;
    expect(api.signupPayload("token", fields, values)).toEqual({
      token: "token",
      forms: [
        {
          personId: null,
          form: [
            { id: "2", type: "person", value: null },
            { id: "2", type: "custom", value: ["a", "b"] },
            { id: "-2", type: "privacy", value: true },
          ],
        },
      ],
    });
  });
  it("prioritizes explicit conditions over canSignUp and identifies closed/waitlist/application states", () => {
    const group = { id: 6263, name: "Team", canSignUp: true, information: {} };
    expect(
      api.signupStatus({
        ...group,
        signUpConditions: { canSignUp: false, endDateNotPassed: false },
      }),
    ).toMatchObject({
      open: false,
      reason: "Die Anmeldefrist ist abgelaufen.",
    });
    expect(
      api.signupStatus({
        ...group,
        autoAccept: false,
        signUpConditions: {
          canSignUp: true,
          groupAllowsWaitinglist: true,
          groupHasSpaceForRequests: false,
        },
      }),
    ).toMatchObject({ open: true, waiting: true, application: true });
  });
  it("runs token → form → signup against the supplied group ID and submits only one form", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: "new-token" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { token: "new-token", group: { id: 6263 }, form: fields },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          verificationNotice: true,
          verificationEmail: "example@example.org",
        }),
      });
    vi.stubGlobal("fetch", fetch);
    const token = await api.requestSignupToken(6263, "homepage");
    const form = await api.loadSignupForm(6263, token.token!);
    const payload = api.signupPayload(
      form.token,
      form.form,
      api.initialValues(form.form),
    );
    expect(await api.submitSignup(6263, payload)).toMatchObject({
      verificationNotice: true,
    });
    expect(fetch.mock.calls.map((call) => call[0])).toEqual([
      "/api/publicgroups/6263/token",
      "/api/publicgroups/6263/form?token=new-token",
      "/api/publicgroups/6263/signup",
    ]);
    expect(JSON.parse(fetch.mock.calls[2]![1].body)).toEqual(payload);
    expect(
      fetch.mock.calls.every((call) => call[1].credentials === "omit"),
    ).toBe(true);
  });
  it("does not treat server validation errors as successful signup", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({
            translatedMessage: "E-Mail prüfen",
            errors: [
              { fieldId: "forms[0].form[0].value", message: "Ungültig" },
            ],
          }),
        }),
    );
    await expect(
      api.submitSignup(6263, api.signupPayload("token", fields, {})),
    ).rejects.toMatchObject({
      message: "E-Mail prüfen",
      status: 400,
      fields: [{ fieldId: "forms[0].form[0].value", message: "Ungültig" }],
    });
  });
  it("rejects forms from a different group and safely encodes tokens", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { token: "a&b", group: { id: 1111 }, form: fields },
        }),
      });
    vi.stubGlobal("fetch", fetch);
    await expect(api.loadSignupForm(6263, "a&b")).rejects.toMatchObject({
      status: 502,
    });
    expect(fetch.mock.calls[0]![0]).toBe(
      "/api/publicgroups/6263/form?token=a%26b",
    );
  });
});
