import { WEATHER_PRESETS } from '../data/seed.js';

const delay = (ms = 800) => new Promise((r) => setTimeout(r, ms));
const ok = (data) => ({ success: true, data });
const err = (code, message) => ({ success: false, error: { code, message } });

function randomFallback() {
  const preset = WEATHER_PRESETS[Math.floor(Math.random() * WEATHER_PRESETS.length)];
  return { ...preset, source: 'mock' };
}

export const weatherService = {
  async getCurrentWeather() {
    await delay();
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(ok({ weather: randomFallback(), locationName: 'Your Location' }));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        () => {
          // Real API would go here — using mock for now
          const mock = randomFallback();
          resolve(ok({ weather: { ...mock, source: 'geolocation-mock' }, locationName: 'Your Location' }));
        },
        () => {
          resolve(ok({ weather: randomFallback(), locationName: 'Your Location' }));
        },
        { timeout: 3000 }
      );
    });
  },
};
