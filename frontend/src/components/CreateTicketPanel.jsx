import { useState } from 'react';

const levels = ['low', 'medium', 'high', 'urgent'];

function looksLikeEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

const blank = {
  subject: '',
  description: '',
  customerEmail: '',
  priority: 'medium',
};

export default function CreateTicketPanel({ onSubmit }) {
  const [form, setForm] = useState(blank);
  const [fieldErr, setFieldErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverMsg, setServerMsg] = useState('');

  function validateForm() {
    const err = {};
    if (!form.subject.trim()) err.subject = 'Please add a subject';
    if (!form.description.trim()) err.description = 'Description cannot be empty';
    if (!form.customerEmail.trim()) {
      err.customerEmail = 'Customer email is needed';
    } else if (!looksLikeEmail(form.customerEmail.trim())) {
      err.customerEmail = 'That does not look like a valid email';
    }
    setFieldErr(err);
    return Object.keys(err).length === 0;
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErr((prev) => ({ ...prev, [name]: undefined }));
    setServerMsg('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setServerMsg('');
    try {
      await onSubmit({
        subject: form.subject.trim(),
        description: form.description.trim(),
        customerEmail: form.customerEmail.trim(),
        priority: form.priority,
      });
      setForm(blank);
    } catch (err) {
      setServerMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="create-panel">
      <h2>Raise a ticket</h2>
      <p className="create-panel__hint">Filled in by customer / agent</p>

      <form onSubmit={handleSubmit} noValidate>
        <label>
          Subject
          <input
            name="subject"
            value={form.subject}
            onChange={onChange}
            className={fieldErr.subject ? 'input--error' : ''}
          />
          {fieldErr.subject && <span className="field-error">{fieldErr.subject}</span>}
        </label>

        <label>
          Description
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={onChange}
            className={fieldErr.description ? 'input--error' : ''}
          />
          {fieldErr.description && (
            <span className="field-error">{fieldErr.description}</span>
          )}
        </label>

        <label>
          Customer email
          <input
            name="customerEmail"
            type="email"
            value={form.customerEmail}
            onChange={onChange}
            className={fieldErr.customerEmail ? 'input--error' : ''}
          />
          {fieldErr.customerEmail && (
            <span className="field-error">{fieldErr.customerEmail}</span>
          )}
        </label>

        <label>
          Priority
          <select name="priority" value={form.priority} onChange={onChange}>
            {levels.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </label>

        {serverMsg ? <p className="form-api-error">{serverMsg}</p> : null}

        <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
          {saving ? 'Saving…' : 'Submit ticket'}
        </button>
      </form>
    </aside>
  );
}
