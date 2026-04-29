// @ts-check
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
        offline: 'You appear to be offline. Reconnect and try again.',
        server: 'We could not save your message right now. Please try again in a moment.',
        duplicate: 'Your message is already being sent. Please wait.'
    });

    const VALIDATION_MESSAGES = Object.freeze({
        name_required: 'Please enter your name.',
        name_too_short: `Your name must be at least ${LIMITS.nameMin} characters.`,
        name_too_long: `Your name must be ${LIMITS.nameMax} characters or fewer.`,
        email_required: 'Please enter your email address.',
        email_too_long: `Your email must be ${LIMITS.emailMax} characters or fewer.`,
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

    function normalizePayloadValues(payload) {
        const rawPayload = payload || {};
        return {
            name: asString(rawPayload.name).trim(),
            email: asString(rawPayload.email).trim().toLowerCase(),
            message: asString(rawPayload.message).trim(),
            botField: asString(rawPayload.botField).trim()
        };
    }

    function sanitizeContactPayload(payload) {
        const normalized = normalizePayloadValues(payload);
        return {
            name: normalizeText(normalized.name, LIMITS.nameMax),
            email: normalizeText(normalized.email, LIMITS.emailMax),
            message: normalizeText(normalized.message, LIMITS.messageMax),
            botField: normalizeText(normalized.botField, LIMITS.messageMax)
        };
    }

    function isValidEmail(email) {
        const normalized = asString(email).trim().toLowerCase();
        if (!normalized || normalized.length > LIMITS.emailMax) {
            return false;
        }

        const parts = normalized.split('@');
        if (parts.length !== 2) {
            return false;
        }

        const localPart = parts[0];
        const domainPart = parts[1];

        if (!localPart || !domainPart || localPart.length > 64 || domainPart.length > 253) {
            return false;
        }

        if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
            return false;
        }

        if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(localPart)) {
            return false;
        }

        if (domainPart.includes('..')) {
            return false;
        }

        const labels = domainPart.split('.');
        if (labels.length < 2) {
            return false;
        }

        const hasValidLabels = labels.every((label) => {
            return label.length > 0
                && !label.startsWith('-')
                && !label.endsWith('-')
                && /^[a-z0-9-]+$/i.test(label);
        });

        const topLevelDomain = labels[labels.length - 1];
        return hasValidLabels && topLevelDomain.length >= 2;
    }

    function validateContactPayload(payload) {
        const normalized = normalizePayloadValues(payload);
        const sanitized = sanitizeContactPayload(normalized);
        const errors = {};
        const isBot = normalized.botField.length > 0;

        if (!normalized.name) {
            errors.name = 'name_required';
        } else if (normalized.name.length > LIMITS.nameMax) {
            errors.name = 'name_too_long';
        } else if (normalized.name.length < LIMITS.nameMin) {
            errors.name = 'name_too_short';
        }

        if (!normalized.email) {
            errors.email = 'email_required';
        } else if (normalized.email.length > LIMITS.emailMax) {
            errors.email = 'email_too_long';
        } else if (!isValidEmail(normalized.email)) {
            errors.email = 'email_invalid';
        }

        if (!normalized.message) {
            errors.message = 'message_required';
        } else if (normalized.message.length > LIMITS.messageMax) {
            errors.message = 'message_too_long';
        } else if (normalized.message.length < LIMITS.messageMin) {
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
