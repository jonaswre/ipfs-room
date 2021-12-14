export const encode: (message: string) => Uint8Array = (message: string) => {
    return new TextEncoder().encode(message);
}

export const decode: (message: Uint8Array) => string = (message: Uint8Array) => {
    return new TextDecoder().decode(message);
}