
declare module 'crypto-js' {
    export namespace CryptoJS {
        interface WordArray {
            words: number[];
            sigBytes: number;
        }

        function SHA256(message: string | ArrayBuffer): WordArray;

        namespace enc {
            const Hex: {
                stringify: (wordArray: WordArray) => string;
                parse: (str: string) => WordArray;
            };
            const Utf8: any;
            const Base64: {
                stringify: (wordArray: WordArray) => string;
                parse: (str: string) => WordArray;
            };
        }
    }

    export default CryptoJS;
}
