
export type MessageCreator = (message: string) => any;

export let errorMessage = (message: string) => {
    return message;
}

export function setErrorCreator(creator: MessageCreator) {
    errorMessage = creator;
}

export type Verifier = (a: any, name: string) => Promise<void>;

/**
 * Verifiers
 */
export async function notNull(a: any, name: string): Promise<void> {
    if (!a) throw errorMessage(`${name} must not be null`);
}

export async function isString(a: any, name: string): Promise<void> {
    if (!(typeof a === 'string' || a instanceof String))
        throw errorMessage(`${name} must be string`);
}

// NumberLike
export async function isNumber(a: any, name: string): Promise<void> {
    if (isNaN(Number(a)))
        throw errorMessage(`'${name}' cannot convert to number`);
}


export async function isInteger(a: string, name: string): Promise<void> {
    if (!(Number(a) % 1))
        throw errorMessage(`'${name}' is not integer`);
}

export async function notNullString(a: any, name: string): Promise<void> {
    await notNull(a, name);
    await isString(a, name);
}

export async function isArray(a: any, name: string): Promise<void> {
    if (!(a instanceof Array))
        throw errorMessage(`'${name}' is not array`);
}

export async function isEmailAddress(a: any, name: string): Promise<void> {
    await matchRegex(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)(a, name)
        .catch(() => {
            throw errorMessage(`'${name}' is not a valied email expression`);
        });
}

/**
 * Verifier Generators
 */
export function isStringRange(min: number, max: number): Verifier {
    return async (a: string, name: string): Promise<void> => {
        await isString(a, name);
        if (a.length < min || max < a.length)
            throw errorMessage(`range of string length must be [${min}, ${max}]`);
    }
}

export function isNumberRange(min: number, max: number): Verifier {
    return async (a: string, name: string): Promise<void> => {
        await isNumber(a, name);
        const n = Number(a);
        if (n < min || max < n)
            throw errorMessage(`range of '${name}' must be [${min}, ${max}]`);
    }
}

export function matchRegex(regex: RegExp) {
    return async (a: string, name: string): Promise<void> => {
        await isString(a, name);
        if (!regex.test(a)) throw errorMessage(`regex verification failed`);
    }
}

export function isArrayOf(child: Verifier): Verifier {
    return async (a: string, name: string): Promise<void> => {
        await isArray(a, name);
        for (let i = 0, length = a.length; i < length; i++) {
            await child(a[i], `${name}[${i}]`);
        }
    }
}

export function containsCharsOfRange(chars: string, min: number, max: number) {
    return async (a: string, name: string): Promise<void> => {
        await isString(a, name);
        const count = (a.match(new RegExp(`[${chars}]`, 'g')) || []).length;
        if (!(min <= count && count <= max)) {
            throw errorMessage(`contains chars of range verification failed for ${name}`);
        }
    }
}

export function or(...vs: Verifier[]): Verifier {
    return async (a: string, name: string): Promise<void> => {
        let result = false;
        let reason = null;
        for (const v of vs) {
            await v(a, name)
                .then(() => { result = true; })
                .catch((err) => { reason += err.toString(); });
        }
        if (!result)
            throw errorMessage(`or verification for '${name}' failed: ${reason}`);
    };
}

export function and(...vs: Verifier[]): Verifier {
    return async (a: string, name: string): Promise<void> => {
        for (const v of vs) {
            let reason = null;
            const r = await v(a, name)
                .then(() => true)
                .catch((err) => {
                    reason = err.toString();
                    return false;
                });
            if (!r)
                throw errorMessage(`and verification for '${name}' failed: ${reason}`);
        }
    };
}

export function not(v: Verifier): Verifier {
    return async (a: string, name: string): Promise<void> => {
        let reason = '';
        if (!(await v(a, name)
            .then(() => true)
            .catch((err) => { reason = err; return false })))
            throw errorMessage(`not verification for ${name} failed: ${reason}`);
    };
}



/**
 * High-Level Functions
 */
export async function constraint(data: any, allow: any = {}, extra: boolean = false): Promise<void> {
    for (const key of Object.keys(data)) {
        if (!extra && !(key in allow)) {
            throw errorMessage(`'${key}' is unnecessary parametor`);
        } else if (Object.prototype.toString.call(data[key]) === '[object Object]') {
            await constraint(data[key], allow[key], extra);
        }
    }
    for (const key of Object.keys(allow)) {
        if (!(key in data)) {
            throw errorMessage(`parameter '${key}' must be provided`);
        } else if (Object.prototype.toString.call(allow[key]) === '[object AsyncFunction]') {
            await allow[key](data[key], key);
        }
    }
}

export const allowExtra = Symbol('allowExtra');

export interface Request {
    params?: any;
    headers?: any;
    query?: any;
    body?: any;
    cookies?: any;
}

export async function verifyParams(req: Request, allow: {
    params?: { [key: string]: Verifier },
    headers?: { [key: string]: Verifier },
    query?: { [key: string]: Verifier },
    body?: { [key: string]: Verifier },
    cookies?: { [key: string]: Verifier },
}) {
    await constraint(req.params, allow.params, allow.params && (allowExtra in allow.params));
    await constraint(req.headers, allow.headers, true);
    await constraint(req.query, allow.query, allow.query && (allowExtra in allow.query));
    await constraint(req.body, allow.body, allow.body && (allowExtra in allow.body));
    await constraint(req.cookies, allow.cookies, true);
}