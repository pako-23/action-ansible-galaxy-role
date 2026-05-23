import { jest } from '@jest/globals';

export const publish = jest.fn<typeof import('../src/galaxy.js').publish>();
export const fetchMock = jest.fn<typeof fetch>();
