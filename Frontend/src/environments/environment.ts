const currentHost =
  typeof window !== 'undefined' && window.location.hostname
    ? window.location.hostname
    : '10.33.34.3';

export const environment = {
  production: false,
  apiBaseUrl: `http://${currentHost}:5228/api`,
  backendRootUrl: `http://${currentHost}:5228`
};
