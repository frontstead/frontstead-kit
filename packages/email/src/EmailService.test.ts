import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockSend = vi.hoisted(() => vi.fn());

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

const {
  sendPasswordReset,
  sendInquiryConfirmation,
  sendWelcome,
  plainTextToHtml,
} = await import('./EmailService.js');

describe('plainTextToHtml', () => {
  it('escapes HTML-significant characters and wraps in a document', () => {
    const html = plainTextToHtml('Tom & Jerry <script>alert("hi")</script>');
    expect(html).toContain('Tom &amp; Jerry &lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toMatch(/<!DOCTYPE html>/);
  });

  it('preserves line breaks via white-space: pre-wrap so paragraphs do not collapse', () => {
    const html = plainTextToHtml('Line one.\n\nLine two.');
    expect(html).toContain('white-space: pre-wrap');
    expect(html).toContain('Line one.\n\nLine two.');
  });
});

describe('plain-text-authored emails render as escaped, wrapped HTML (not raw text)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-key';
    mockSend.mockResolvedValue({ data: { id: 'em_1' }, error: null });
  });

  it('sendPasswordReset sends HTML wrapped via plainTextToHtml, not the raw text string', async () => {
    await sendPasswordReset('user@example.com', 'reset-token', 'Jane');

    expect(mockSend).toHaveBeenCalledOnce();
    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).toMatch(/<!DOCTYPE html>/);
    expect(payload.html).toContain('white-space: pre-wrap');
  });

  it('sendWelcome escapes HTML-significant characters in the user name', async () => {
    await sendWelcome('user@example.com', 'Tom & Jerry <b>');

    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).toContain('Tom &amp; Jerry &lt;b&gt;');
    expect(payload.html).not.toContain('<b>');
  });

  it('sendWelcome names the site the account belongs to, Frontstead by default', async () => {
    await sendWelcome('user@example.com', 'Pat', 'Carolina Example Homes');
    expect(mockSend.mock.calls[0][0].subject).toBe('Welcome to Carolina Example Homes');
    expect(mockSend.mock.calls[0][0].text).toContain('Welcome to Carolina Example Homes.');
    await sendWelcome('user@example.com', 'Pat');
    expect(mockSend.mock.calls[1][0].subject).toBe('Welcome to Frontstead');
  });

  it('uses EMAIL_REPLY_TO when set and no default reply-to otherwise', async () => {
    delete process.env.EMAIL_REPLY_TO;
    await sendWelcome('user@example.com', 'Pat');
    expect(mockSend.mock.calls[0][0].replyTo).toBeUndefined();
    process.env.EMAIL_REPLY_TO = 'help@example.com';
    await sendWelcome('user@example.com', 'Pat');
    expect(mockSend.mock.calls[1][0].replyTo).toBe('help@example.com');
    delete process.env.EMAIL_REPLY_TO;
  });

  it('sendInquiryConfirmation sends wrapped HTML, not raw unescaped text as the html body', async () => {
    await sendInquiryConfirmation('user@example.com', { address: '123 Main St', city: 'Charlotte', state: 'NC' });

    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).toMatch(/<!DOCTYPE html>/);
    expect(payload.text).toContain('123 Main St');
  });
});
