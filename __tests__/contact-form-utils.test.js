const {
    LIMITS,
    sanitizeContactPayload,
    isValidEmail,
    validateContactPayload,
    encodeContactPayload,
    getStatusMessage,
    getValidationMessage
} = require('../js/contact-form-utils.js');

describe('contact-form-utils', () => {
    test('accepts valid contact payload (happy path)', () => {
        const payload = {
            name: 'Mario Preciado',
            email: 'mario@example.com',
            message: 'Hello, I would like to book a live session.',
            botField: ''
        };

        const result = validateContactPayload(payload);

        expect(result.isValid).toBe(true);
        expect(result.isBot).toBe(false);
        expect(result.errors).toEqual({});
    });

    test('trims and normalizes fields', () => {
        const payload = sanitizeContactPayload({
            name: '  Mario   ',
            email: '  TEST@EXAMPLE.COM ',
            message: '  Hello world!  ',
            botField: '   '
        });

        expect(payload.name).toBe('Mario');
        expect(payload.email).toBe('test@example.com');
        expect(payload.message).toBe('Hello world!');
        expect(payload.botField).toBe('');
    });

    test('rejects empty required fields (sad path)', () => {
        const result = validateContactPayload({
            name: '',
            email: '',
            message: ''
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual({
            name: 'name_required',
            email: 'email_required',
            message: 'message_required'
        });
    });

    test('rejects malformed emails', () => {
        expect(isValidEmail('not-an-email')).toBe(false);
        expect(isValidEmail('foo@bar')).toBe(false);
        expect(isValidEmail('foo bar@example.com')).toBe(false);
    });

    test('flags bot honeypot without crashing', () => {
        const result = validateContactPayload({
            name: 'Real Person',
            email: 'real@example.com',
            message: 'This should be treated as spam.',
            botField: 'I am a bot'
        });

        expect(result.isBot).toBe(true);
        expect(result.isValid).toBe(false);
    });

    test('caps very long values at field limits', () => {
        const overlongName = 'a'.repeat(LIMITS.nameMax + 25);
        const overlongEmail = `${'a'.repeat(500)}@example.com`;
        const overlongMessage = 'b'.repeat(LIMITS.messageMax + 200);

        const payload = sanitizeContactPayload({
            name: overlongName,
            email: overlongEmail,
            message: overlongMessage
        });

        expect(payload.name.length).toBe(LIMITS.nameMax);
        expect(payload.email.length).toBe(LIMITS.emailMax);
        expect(payload.message.length).toBe(LIMITS.messageMax);
    });

    test('encodes payload for Netlify-compatible form submission', () => {
        const encoded = encodeContactPayload({
            name: 'Jane Doe',
            email: 'jane@example.com',
            message: 'Need photo coverage for an event.'
        });

        const params = new URLSearchParams(encoded);
        expect(params.get('form-name')).toBe('contact');
        expect(params.get('name')).toBe('Jane Doe');
        expect(params.get('email')).toBe('jane@example.com');
        expect(params.get('message')).toBe('Need photo coverage for an event.');
        expect(params.get('bot-field')).toBe('');
    });

    test('returns user-friendly status and validation messages', () => {
        expect(getStatusMessage('sending')).toBe('Sending your message...');
        expect(getStatusMessage('missing-key')).toContain('could not save');
        expect(getValidationMessage('email_invalid')).toContain('valid email');
    });
});
