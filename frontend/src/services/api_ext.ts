// frontend service additions
import api from './api';

export const authAPIExt = {
  sendOtp: () => api.post('/auth/send-otp'),
  verifyOtp: (code) => api.post('/auth/verify-otp', { code })
};

export const manualDepositsAPI = {
  uploadEvidence: (depositId, filename, dataBase64) => api.post(`/manual-deposits/${depositId}/evidence`, { filename, dataBase64 }),
  acceptMatch: (matchId) => api.post(`/manual-deposits/matches/${matchId}/accept`)
};
