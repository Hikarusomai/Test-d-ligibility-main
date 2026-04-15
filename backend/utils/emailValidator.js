const DISPOSABLE_DOMAINS = [
    'mailnator.com',
    'tempail.com',
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    'guerrillamail.org',
    'guerrillamail.net',
    'sharklasers.com',
    'grr.la',
    'guerrillamailblock.com',
    'pokemail.net',
    'spam4.me',
    'mailnesia.com',
    'tempmailaddress.com',
    'fakeinbox.com',
    '10minutemail.com',
    '10minutemail.net',
    '10minutemail.org',
    'temp-mail.org',
    'temp-mail.io',
    'tempinbox.com',
    'dispostable.com',
    'mailinator.com',
    'mailinator2.com',
    'mailinater.com',
    'maildrop.cc',
    'getairmail.com',
    'getnada.com',
    'yopmail.com',
    'yopmail.fr',
    'trashmail.com',
    'trashmail.net',
    'trashmail.org',
    'mailnesia.com',
    'spamgourmet.com',
    'spamex.com',
    'emailondeck.com',
    'mohmal.com',
    'tempail.com',
    'tempmailo.com',
    'tempmail.plus',
    'tmpmail.org',
    'fakemailgenerator.com',
    'emailfake.com',
    'tempinbox.xyz',
    'burnermail.io',
    'mailsac.com',
    'mytrashmail.com',
    'mailcatch.com',
    'mailnull.com',
    'spamherelots.com',
    'devnullmail.com',
    'sogetthis.com',
    'mailin8r.com',
    'mailinator.net',
    'mailinater.com',
    'emailage.cf',
    'emailage.ga',
    'emailage.gq',
    'emailage.ml',
    'emailage.tk'
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return {
            valid: false,
            error: 'Email is required'
        };
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail.length > 254) {
        return {
            valid: false,
            error: 'Email address is too long'
        };
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return {
            valid: false,
            error: 'Please enter a valid email address'
        };
    }

    const [, domain] = normalizedEmail.split('@');

    if (!domain || domain.length > 63) {
        return {
            valid: false,
            error: 'Please enter a valid email domain'
        };
    }

    if (DISPOSABLE_DOMAINS.includes(domain)) {
        return {
            valid: false,
            error: 'Temporary/disposable email addresses are not allowed. Please use a permanent email.'
        };
    }

    const domainParts = domain.split('.');
    if (domainParts.some(part => part.length === 0)) {
        return {
            valid: false,
            error: 'Please enter a valid email domain'
        };
    }

    return {
        valid: true,
        normalizedEmail
    };
}

function isDisposableDomain(domain) {
    if (!domain) return false;
    return DISPOSABLE_DOMAINS.includes(domain.toLowerCase());
}

module.exports = {
    validateEmail,
    isDisposableDomain,
    DISPOSABLE_DOMAINS
};
