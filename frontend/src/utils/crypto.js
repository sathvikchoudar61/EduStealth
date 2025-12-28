// EduStealth E2E Encryption Utility (WebCrypto API)

// Generate RSA-OAEP Key Pair (2048-bit)
export const generateKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    );
    return keyPair;
};

// Export Key to Base64 (for storage/transmission)
export const exportKey = async (key) => {
    const format = key.type === 'private' ? 'pkcs8' : 'spki';
    const exported = await window.crypto.subtle.exportKey(format, key);
    return arrayBufferToBase64(exported);
};

// Import Key from Base64
export const importKey = async (pem, type = 'public') => {
    const binaryDer = base64ToArrayBuffer(pem);
    const format = type === 'private' ? 'pkcs8' : 'spki';
    const usage = type === 'private' ? ['decrypt'] : ['encrypt'];

    return await window.crypto.subtle.importKey(
        format,
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        usage
    );
};

// Hybrid Encryption: AES-GCM (Message) + RSA-OAEP (Key, Recipient Public Key)
export const encryptMessage = async (message, publicKey) => {
    try {
        const enc = new TextEncoder();
        const data = enc.encode(message);

        // 1. Generate random AES-GCM key
        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        // 2. Encrypt message with AES
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            data
        );

        // 3. Encrypt AES key with RSA Public Key
        const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const encryptedKey = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            rawAesKey
        );

        // 4. Package everything
        return JSON.stringify({
            iv: arrayBufferToBase64(iv.buffer),
            key: arrayBufferToBase64(encryptedKey),
            data: arrayBufferToBase64(encryptedContent)
        });
    } catch (e) {
        console.error("Encryption failed:", e);
        return null;
    }
};

// Hybrid Decryption
export const decryptMessage = async (packedMessage, privateKey) => {
    try {
        const pkg = JSON.parse(packedMessage);
        const iv = base64ToArrayBuffer(pkg.iv);
        const encryptedKey = base64ToArrayBuffer(pkg.key);
        const encryptedData = base64ToArrayBuffer(pkg.data);

        // 1. Decrypt AES Key using RSA Private Key
        const rawAesKey = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedKey
        );

        // 2. Import decrypted AES Key
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            rawAesKey,
            { name: "AES-GCM" },
            true,
            ["encrypt", "decrypt"]
        );

        // 3. Decrypt Content
        const decryptedData = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            encryptedData
        );

        const dec = new TextDecoder();
        return dec.decode(decryptedData);
    } catch (e) {
        console.error("Decryption failed:", e);
        return "⚠️ Decryption Error";
    }
};

// Helpers
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export const isBase64 = (str) => {
    try { return btoa(atob(str)) === str; }
    catch (err) { return false; }
};

export const isEncrypted = (str) => {
    if (!str || typeof str !== 'string') return false;
    const s = str.trim();
    if (!s.startsWith('{') || !s.endsWith('}')) return false;
    try {
        const parsed = JSON.parse(s);
        return parsed.iv && parsed.key && parsed.data;
    } catch (e) {
        return false;
    }
};
