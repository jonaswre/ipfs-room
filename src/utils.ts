export const encode = (message: string) => {
    return new TextEncoder().encode(message);
}

export const decode = (message: Uint8Array) => {
    return new TextDecoder().decode(message);
}