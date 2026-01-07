/**
 * Unicode-safe base64 encoding using TextEncoder
 * Handles emoji and international characters properly
 */
export function base64EncodeUnicode(str: string): string {
    return btoa(
        new TextEncoder().encode(str)
            .reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
}

/**
 * Unicode-safe base64 decoding using TextDecoder
 * Handles emoji and international characters properly
 */
export function base64DecodeUnicode(base64: string): string {
    const bytes = Uint8Array.from(
        atob(base64),
        c => c.charCodeAt(0)
    );
    return new TextDecoder().decode(bytes);
}
