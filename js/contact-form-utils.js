// @ts-check
/* eslint-disable no-var */
(function createContactFormUtils(root) {
    const LIMITS = Object.freeze({
        nameMin: 2,
        nameMax: 100,
        emailMax: 254,
        messageMin: 10,
        messageMax: 3000
    });

    const STATUS_MESSAGES = Object.freeze({
        sending: 'Sending your message...',
        success: 'Thanks. Your message was sent successfully.',
        network: 'We could not send your message. Check your connection and try again.',
        timeout: 'The request took too long. Please try again.',
        server: 'We could not save your message right now. Please try again in a moment.',
        duplicate: 'Your message is already being sent. Please wait.'
    });

    const VALIDATION_MESSAGES = Object.freeze({
        name_required: 'Please enter your name.',
        name_too_short: `Your name must be at least ${LIMITS.nameMin} characters.`,
        name_too_long: `Your name must be ${LIMITS.nameMax} characters or fewer.`,
        email_required: 'Please enter your email address.',
        email_invalid: 'Please enter a valid email address.',
        message_required: 'Please enter a message.',
        message_too_short: `Your message must be at least ${LIMITS.messageMin} characters.`,
        message_too_long: `Your message must be ${LIMITS.messageMax} characters or fewer.`
    });

    function asString(value) {
        return typeof value === 'string' ? value : '';
    }

    function normalizeText(value, maxLength) {
        const normalized = asString(value).trim();
        return normalized.slice(0, maxLength);
    }

    function sanitizeContactPayload(payload) {
        const rawPayload = payload || {};
        return {
            name: normalizeText(rawPayload.name, LIMITS.nameMax),
            email: normalizeText(rawPayload.email, LIMITS.emailMax).toLowerCase(),
            message: normalizeText(rawPayload.message, LIMITS.messageMax),
            botField: normalizeText(rawPayload.botField, LIMITS.messageMax)
        };
    }

    function isValidEmail(email) {
        const normalized = asString(email).trim().toLowerCase();
        if (!normalized || normalized.length > LIMITS.emailMax) {
            return false;
        }

        // Practical validation that rejects obvious malformed addresses.
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        return pattern.test(normalized);
    }

    function validateContactPayload(payload) {
        const sanitized = sanitizeContactPayload(payload);
        const errors = {};
        const isBot = sanitized.botField.length > 0;

        if (!sanitized.name) {
            errors.name = 'name_required';
        } else if (sanitized.name.length < LIMITS.nameMin) {
            errors.name = 'name_too_short';
        }

        if (!sanitized.email) {
            errors.email = 'email_required';
        } else if (!isValidEmail(sanitized.email)) {
            errors.email = 'email_invalid';
        }

        if (!sanitized.message) {
            errors.message = 'message_required';
        } else if (sanitized.message.length < LIMITS.messageMin) {
            errors.message = 'message_too_short';
        }

        return {
            isValid: Object.keys(errors).length === 0 && !isBot,
            isBot,
            errors,
            sanitized
        };
    }

    function encodeContactPayload(payload) {
        const sanitized = sanitizeContactPayload(payload);
        const body = new URLSearchParams();
        body.set('form-name', 'contact');
        body.set('name', sanitized.name);
        body.set('email', sanitized.email);
        body.set('message', sanitized.message);
        body.set('bot-field', sanitized.botField);
        return body.toString();
    }

    function getStatusMessage(code) {
        return STATUS_MESSAGES[code] || STATUS_MESSAGES.server;
    }

    function getValidationMessage(code) {
        return VALIDATION_MESSAGES[code] || STATUS_MESSAGES.server;
    }

    const api = {
        LIMITS,
        sanitizeContactPayload,
        isValidEmail,
        validateContactPayload,
        encodeContactPayload,
        getStatusMessage,
        getValidationMessage
    };

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    root.ContactFormUtils = api;
}(typeof globalThis !== 'undefined' ? globalThis : window));
