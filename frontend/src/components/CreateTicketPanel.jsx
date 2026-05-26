import { useState } from 'react';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyForm = {
  subject: '',
  description: '',
  customerEmail: '',
  priority: 'medium',
};

export default function CreateTicketPanel({ onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  function validate() {
    const next = {};
    if (!form.subject.trim()) next.subject = 'Subject is required';
    if (!form.description.trim()) next.description = 'Description is required';
    if (!form.customerEmail.trim()) {
      next.customerEmail = 'Email is required';
    } else if (!EMAIL_RE.test(form.customerEmail.trim())) {
      next.customerEmail = 'Enter a valid email address';
    }
    if (!PRIORITIES.includes(form.priority)) {
      next.priority = 'Select a valid priority';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: '' }));
    setApiError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError('');
    try {
      const ticket = await onCreated({
        subject: form.subject.trim(),
        description: form.description.trim(),
        customerEmail: form.customerEmail.trim(),
        priority: form.priority,
      });
      setForm(emptyForm);
      return ticket;
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className="create-panel">
      <h2>New ticket</h2>
      <p className="create-panel__hint">Customer submission</p>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Subject
          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            className={errors.subject ? 'input--error' : ''}
            placeholder="Brief summary"
          />
          {errors.subject && (
            <span className="field-error">{errors.subject}</span>
          )}
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className={errors.description ? 'input--error' : ''}
            placeholder="What is the issue?"
          />
          {errors.description && (
            <span className="field-error">{errors.description}</span>
          )}
        </label>

        <label>
          Customer email
          <input
            name="customerEmail"
            type="email"
            value={form.customerEmail}
            onChange={handleChange}
            className={errors.customerEmail ? 'input--error' : ''}
            placeholder="customer@example.com"
          />
          {errors.customerEmail && (
            <span className="field-error">{errors.customerEmail}</span>
          )}
        </label>

        <label>
          Priority
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </label>

        {apiError && <p className="form-api-error">{apiError}</p>}

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create ticket'}
        </button>
      </form>
    </aside>
  );
}
