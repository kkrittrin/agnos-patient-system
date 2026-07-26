export const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];

export const FIELD_GROUPS = [
  {
    key: "identity",
    title: "Who are you?",
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true, autoComplete: "given-name" },
      { name: "middleName", label: "Middle name", type: "text", required: false, autoComplete: "additional-name" },
      { name: "lastName", label: "Last name", type: "text", required: true, autoComplete: "family-name" },
      { name: "dateOfBirth", label: "Date of birth", type: "date", required: true, autoComplete: "bday" },
      { name: "gender", label: "Gender", type: "select", required: true, options: GENDER_OPTIONS },
      { name: "nationality", label: "Nationality", type: "text", required: true },
    ],
  },
  {
    key: "contact",
    title: "How can we reach you?",
    fields: [
      { name: "phone", label: "Phone number", type: "tel", required: true, autoComplete: "tel" },
      { name: "email", label: "Email", type: "email", required: false, autoComplete: "email" },
      { name: "address", label: "Address", type: "textarea", required: true, autoComplete: "street-address" },
      { name: "preferredLanguage", label: "Preferred language", type: "text", required: true },
    ],
  },
  {
    key: "additional",
    title: "A little more (optional)",
    fields: [
      { name: "emergencyContactName", label: "Emergency contact name", type: "text", required: false },
      { name: "emergencyContactRelationship", label: "Relationship", type: "text", required: false },
      { name: "religion", label: "Religion", type: "text", required: false },
    ],
  },
];

export const ALL_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s().-]{7,20}$/;

export function validateField(name, value) {
  const field = ALL_FIELDS.find((f) => f.name === name);
  if (!field) return null;
  const trimmed = (value ?? "").toString().trim();

  if (field.required && trimmed.length === 0) {
    return `${field.label} is required.`;
  }
  if (trimmed.length === 0) return null; // optional & empty is fine

  if (field.type === "email" && !EMAIL_RE.test(trimmed)) {
    return "Enter a valid email address.";
  }
  if (field.type === "tel" && !PHONE_RE.test(trimmed)) {
    return "Enter a valid phone number.";
  }
  if (field.type === "date") {
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime()) || date > new Date()) {
      return "Enter a valid date of birth.";
    }
  }
  return null;
}

export function validateAll(data) {
  const errors = {};
  for (const field of ALL_FIELDS) {
    const error = validateField(field.name, data[field.name]);
    if (error) errors[field.name] = error;
  }
  return errors;
}

export function isGroupComplete(groupKey, data) {
  const group = FIELD_GROUPS.find((g) => g.key === groupKey);
  if (!group) return true;
  return group.fields.every((f) => !validateField(f.name, data[f.name]));
}
