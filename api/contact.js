// @ts-check

const {
    validateContactPayload,
    getValidationMessage
} = require('../js/contact-form-utils.js');

const RESEND_API_URL = 'https://api.resend.com/emails';

function asString(value) {
    return typeof value === 'string' ? value : '';
}

function parseRequestBody(body) {
    if (!body) {
        return {};
    }

    if (Buffer.isBuffer(body)) {
        return parseRequestBody(body.toString('utf8'));
    }

    if (typeof body === 'string') {
        const trimmed = body.trim();
        if (!trimmed) {
            return {};
        }

        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                return parseRequestBody(JSON.parse(trimmed));
            } catch (error) {
                return {};
            }
        }

        const params = new URLSearchParams(trimmed);
        return {
            name: params.get('name'),
            email: params.get('email'),
            message: params.get('message'),
            botField: params.get('bot-field') || params.get('botField')
        };
    }

    if (typeof body === 'object') {
        return {
            name: body.name,
            email: body.email,
            message: body.message,
            botField: body['bot-field'] || body.botField
        };
    }

    return {};
}

function escapeHtml(value) {
    return asString(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
}

async function sendViaResend(sanitizedPayload) {
    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>';

    if (!apiKey || !toEmail) {
        return { delivered: false };
    }

    const subject = process.env.CONTACT_SUBJECT || 'New Portfolio Contact Submission';
    const escapedName = escapeHtml(sanitizedPayload.name);
    const escapedEmail = escapeHtml(sanitizedPayload.email);
    const escapedMessage = escapeHtml(sanitizedPayload.message).replace(/\n/g, '<br>');

    const html = [
        '<h2>New Contact Submission</h2>',
        `<p><strong>Name:</strong> ${escapedName}</p>`,
        `<p><strong>Email:</strong> ${escapedEmail}</p>`,
        `<p><strong>Message:</strong><br>${escapedMessage}</p>`
    ].join('');

    const text = [
        'New Contact Submission',
        `Name: ${sanitizedPayload.name}`,
        `Email: ${sanitizedPayload.email}`,
        '',
        sanitizedPayload.message
    ].join('\n');

    const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            subject,
            html,
            text,
            reply_to: sanitizedPayload.email
        })
    });

    if (!response.ok) {
        const responseText = await response.text().catch(() => '');
        const error = new Error(`Resend request failed with status ${response.status}`);
        error.status = response.status;
        error.details = responseText.slice(0, 400);
        throw error;
    }

    return { delivered: true };
}

module.exports = async function contactHandler(req, res) {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return sendJson(res, 204, {});
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return sendJson(res, 405, {
            ok: false,
            message: 'Method not allowed.'
        });
    }

    const payload = parseRequestBody(req.body);
    const validation = validateContactPayload(payload);

    if (validation.isBot) {
        // Return a successful response to avoid signaling bot detection behavior.
        return sendJson(res, 200, { ok: true });
    }

    if (!validation.isValid) {
        const fieldOrder = ['name', 'email', 'message'];
        const firstErrorCode = fieldOrder
            .map((fieldName) => validation.errors[fieldName])
            .find(Boolean);

        return sendJson(res, 400, {
            ok: false,
            message: getValidationMessage(firstErrorCode),
            errors: validation.errors
        });
    }

    try {
        const delivery = await sendViaResend(validation.sanitized);
        if (!delivery.delivered) {
            console.warn('[contact-api] RESEND_API_KEY or CONTACT_TO_EMAIL is not configured.');
            return sendJson(res, 503, {
                ok: false,
                message: 'Contact delivery is temporarily unavailable. Please email us directly.'
            });
        }

        return sendJson(res, 200, { ok: true });
    } catch (error) {
        console.error('[contact-api] failed to process submission', error);
        return sendJson(res, 502, {
            ok: false,
            message: 'We could not deliver your message right now. Please try again shortly.'
        });
    }
};
