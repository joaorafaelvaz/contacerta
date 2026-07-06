// Produção: contacerta.linkwise.digital. No dev com Expo Go, aponte para o IP
// da máquina que roda o servidor:
// EXPO_PUBLIC_API_URL=http://192.168.x.x:3002 npx expo start
const PROD_URL = "https://contacerta.linkwise.digital";
const DEV_URL = "http://localhost:3002";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? DEV_URL : PROD_URL);
