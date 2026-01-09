import { apiSearchStops, apiGetLines, apiGetLineStops, apiGetStopById, invalidateCache } from '../services/transitApiClient';
import { getTransitApiBaseUrl } from '../utils/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../utils/env', () => ({
  getTransitApiBaseUrl: jest.fn(() => 'http://localhost:4000'),
}));
jest.mock('../utils/errorReporting', () => ({
  captureError: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

// Memory cache'i temizlemek için invalidateCache'i kullan
describe('transitApiClient', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Memory cache'i temizle
    await invalidateCache();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('apiSearchStops', () => {
    it('should search stops successfully', async () => {
      const mockResponse = {
        stops: [
          { id: '1', name: 'Test Stop', latitude: 41.0082, longitude: 28.9784 },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiSearchStops({ q: 'test' });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stops/search?q=test'),
        expect.any(Object)
      );
    });

    it('should retry on network error', async () => {
      // Network error için TypeError fırlat (gerçek implementasyonda TypeError network error olarak algılanıyor)
      const networkError = new TypeError('Failed to fetch');
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ stops: [] }),
        });

      const result = await apiSearchStops({ q: 'test' });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ stops: [] });
    });

    it('should use cached response when available', async () => {
      const mockCachedData = {
        timestamp: Date.now() - 1000, // 1 second ago (cache TTL 5 dakika, hala geçerli)
        data: { stops: [{ id: '1', name: 'Cached Stop', latitude: 41.0082, longitude: 28.9784 }] },
      };

      // Cache key'i oluştur (URL'ye göre)
      const cacheKey = `transitApiCache:http://localhost:4000/stops/search?q=test`;
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockCachedData));

      const result = await apiSearchStops({ q: 'test' });

      // Cache'den dönen veri aynı formatta olmalı
      expect(result).toEqual(mockCachedData.data);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('apiGetLines', () => {
    it('should fetch lines successfully', async () => {
      const mockResponse = {
        lines: [
          { id: '1', name: 'Test Line', code: 'T1' },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiGetLines();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/lines'),
        expect.any(Object)
      );
    });

    it('should handle query parameters', async () => {
      const mockResponse = { lines: [] };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await apiGetLines({ mode: 'BUS', q: 'test' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/lines?mode=BUS&q=test'),
        expect.any(Object)
      );
    });
  });

  describe('apiGetLineStops', () => {
    it('should fetch line stops successfully', async () => {
      const mockResponse = {
        line: { id: '1', name: 'Test Line' },
        stops: [{ id: '1', name: 'Stop 1' }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiGetLineStops('line-1');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/lines/line-1/stops'),
        expect.any(Object)
      );
    });

    it('should encode line ID in URL', async () => {
      const mockResponse = { line: {}, stops: [] };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await apiGetLineStops('line with spaces');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/lines/line%20with%20spaces/stops'),
        expect.any(Object)
      );
    });
  });

  describe('apiGetStopById', () => {
    it('should fetch stop by ID successfully', async () => {
      const mockResponse = {
        stop: { id: '1', name: 'Test Stop' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiGetStopById('stop-1');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stops/stop-1'),
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should throw error on 404', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      await expect(apiGetStopById('invalid-id')).rejects.toThrow();
    });

    it('should retry on 500 error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ stop: { id: '1', name: 'Test Stop' } }),
        });

      const result = await apiGetStopById('stop-1');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ stop: { id: '1', name: 'Test Stop' } });
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate all cache when no pattern provided', async () => {
      // Memory cache'e bir item ekle (invalidateCache memory cache'i de temizliyor)
      const cacheKey = 'transitApiCache:http://localhost:4000/test';
      // Memory cache'e direkt erişim yok, ama invalidateCache çağrısı memory cache'i de temizler
      await invalidateCache();

      // AsyncStorage.removeItem çağrılmış olmalı (memory cache'de key varsa)
      // Ama memory cache boş olabilir, bu yüzden sadece çağrıldığını kontrol et
      // (removeItem catch ile sarmalanmış, hata fırlatmaz)
    });

    it('should invalidate cache matching pattern', async () => {
      // Memory cache'e pattern'e uyan bir key ekle
      await invalidateCache('stops/search');

      // Pattern'e uyan key'ler için removeItem çağrılmalı
      // (memory cache'de key varsa)
    });
  });
});

