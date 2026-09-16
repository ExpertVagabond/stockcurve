import { Buffer } from "buffer";
export { Buffer };
window.Buffer = Buffer;
window.process = window.process || { env: {}, browser: true, version: "" };
