import { kitEnvWith } from './env'
import { kitFetch, type KitResult } from './client'

/**
 * Contact forms, wired to the Apotome Labs add-on service.
 *
 * Replaces the pattern where every site had its own tiny NestJS app whose only
 * job was one nodemailer call, with the recipient hardcoded in source.
 *
 * Framework-agnostic on purpose: no Vue import, so the same file drops into a
 * React or plain-DOM site unchanged. The three-line Vue usage is in README.md.
 */

export type FormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'date'

export interface FormFieldDef {
  key: string
  label: string
  type: FormFieldType
  required?: boolean
  options?: string[]
  maxLength?: number
  placeholder?: string
}

export interface ApotomeFormOptions {
  /** the form's slug in the portal; sites with one form can leave this alone */
  form?: string
  siteKey?: string
  apiUrl?: string
}

export interface ApotomeForm {
  /**
   * The name to give a hidden decoy input.
   *
   * Render it, keep it empty, and hide it with CSS rather than `type="hidden"`
   * (a hidden input is trivially skipped; a styled-away text input is not).
   * Anything arriving in it means a bot filled a field no human can see, and
   * the submission is dropped with a success message so the bot stops trying.
   */
  honeypotField: string
  /** true once the environment is wired; false means every submit is a no-op */
  configured: boolean
  submit(fields: Record<string, string>): Promise<KitResult<{ message: string }>>
  schema(): Promise<KitResult<{ slug: string; name: string; fields: FormFieldDef[] }>>
}

const DEFAULT_HONEYPOT = 'company_website'

export function createApotomeForm(opts: ApotomeFormOptions = {}): ApotomeForm {
  const env = kitEnvWith(opts)
  const slug = opts.form || 'contact'

  // Stamped when the form is constructed, which is page load, and sent as
  // elapsedMs on submit. The server drops anything filled faster than a human
  // could read it. Keeping the clock here means the site does not have to
  // remember to start one.
  const openedAt = Date.now()

  return {
    honeypotField: DEFAULT_HONEYPOT,
    configured: Boolean(env),

    async submit(fields) {
      if (!env) {
        return { ok: false, error: 'This form is not connected yet.' }
      }
      const hp = fields[DEFAULT_HONEYPOT] ?? ''
      const rest = { ...fields }
      delete rest[DEFAULT_HONEYPOT]

      // exactly these four keys: the API runs class-validator with
      // forbidNonWhitelisted + whitelist, so anything else is stripped silently
      return kitFetch<{ message: string }>(
        env,
        `/forms/${encodeURIComponent(env.siteKey)}/${encodeURIComponent(slug)}`,
        {
          method: 'POST',
          body: JSON.stringify({
            fields: rest,
            hp,
            elapsedMs: Date.now() - openedAt,
          }),
        },
      )
    },

    async schema() {
      if (!env) return { ok: false, error: 'This form is not connected yet.' }
      return kitFetch(
        env,
        `/forms/${encodeURIComponent(env.siteKey)}/${encodeURIComponent(slug)}`,
      )
    },
  }
}
