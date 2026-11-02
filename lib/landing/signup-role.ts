/** The roles signup offers; a `?role=` link may preselect one of them and nothing else. */
const SIGNUP_ROLES = ['chamber_admin', 'client'] as const;

export type SignupRole = (typeof SIGNUP_ROLES)[number];

export function parseSignupRole(value: string | null | undefined): SignupRole | null {
    return SIGNUP_ROLES.find((role) => role === value) ?? null;
}
