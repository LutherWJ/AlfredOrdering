// Explicit Error handling types
export type Success<T> = {
    ok: true
    value: T;
}

export type Failure<E> = {
    ok: false
    error: E
}

export type Result<T,E> = Success<T> | Failure<E>;
// helpers
export const ok = <T>(value: T): Success<T> => ({ ok: true, value });
export const err = <E>(error: E): Failure<E> => ({ ok: false, error });

