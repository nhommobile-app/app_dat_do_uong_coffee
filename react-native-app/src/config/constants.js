// FORCE RELOAD - DO NOT USE LOCALHOST
const SERVER_IP = '192.168.1.104';
const SERVER_PORT = 3000;

// Export URLs với IP thay vì localhost
export const BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}`;
export const API_URL = `http://${SERVER_IP}:${SERVER_PORT}/api`;

// Debug log
console.log('✅ CONFIG RELOADED - Using IP:', SERVER_IP);
console.log('   BASE_URL:', BASE_URL);
console.log('   API_URL:', API_URL);