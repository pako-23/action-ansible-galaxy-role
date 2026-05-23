/**
 * Unit tests for src/galaxy.ts
 */

import { jest } from '@jest/globals';
import * as core from '../__fixtures__/core.js';
import { fetchMock } from '../__fixtures__/galaxy.js';

jest.unstable_mockModule('@actions/core', () => core);

const { publish } = await import('../src/galaxy.js');

function mockOk(body: unknown) {
  return { ok: true, text: async () => JSON.stringify(body) } as Response;
}

function mockError(status: number) {
  return { ok: false, status } as Response;
}

function createResult(id: number | string) {
  return { results: [{ id, github_user: 'owner', github_repo: 'repository' }] };
}

function statusResult(id: number | string, state: string) {
  return { results: [{ id, state }] };
}

function expectPostCall(token: string, body: object) {
  expect(fetchMock).toHaveBeenNthCalledWith(
    1,
    'https://galaxy.ansible.com/api/v1/imports/',
    expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`
      },
      body: JSON.stringify(body)
    })
  );
}

function expectGetCall(token: string, nthCall: number, id: number | string) {
  expect(fetchMock).toHaveBeenNthCalledWith(
    nthCall,
    `https://galaxy.ansible.com/api/v1/imports?id=${id}`,
    expect.objectContaining({
      method: 'GET',
      headers: { Authorization: `Token ${token}` }
    })
  );
}

describe('galaxy.ts', () => {
  const ENV: NodeJS.ProcessEnv = process.env;
  const owner: string = 'owner';
  const repository: string = 'repository';
  const token: string = Math.random().toString(36).substring(2);
  const fetchOriginal = globalThis.fetch;

  beforeEach(() => {
    process.env = {
      ...ENV,
      GITHUB_ACTION_REPOSITORY: `${owner}/${repository}`
    };

    jest.useFakeTimers();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    process.env = ENV;
    globalThis.fetch = fetchOriginal;
    jest.useRealTimers();
  });

  it.each([
    { states: ['SUCCESS'] },
    { states: ['WAITING', 'SUCCESS'] },
    { states: ['RUNNING', 'SUCCESS'] },
    { states: ['WAITING', 'RUNNING', 'SUCCESS'] }
  ])(
    'successfully publishes to ansible galaxy when states are $states',
    async ({ states }) => {
      const taskId = 123456;

      fetchMock.mockResolvedValueOnce(mockOk(createResult(taskId)));

      for (const state of states) {
        fetchMock.mockResolvedValueOnce(mockOk(statusResult(taskId, state)));
      }

      const promise: Promise<void> = publish(token);
      await jest.advanceTimersByTimeAsync(states.length * 5_000);
      await promise;

      expect(fetchMock).toHaveBeenCalledTimes(states.length + 1);
      expectPostCall(token, { user: owner, repo: repository });

      for (let i = 2; i <= states.length + 1; i++)
        expectGetCall(token, i, taskId);
    }
  );

  it.each([
    { states: ['FAILED'] },
    { states: ['WAITING', 'FAILED'] },
    { states: ['RUNNING', 'FAILED'] },
    { states: ['WAITING', 'RUNNING', 'FAILED'] }
  ])('throws error when states are $states', async ({ states }) => {
    const taskId = 123456;

    fetchMock.mockResolvedValueOnce(mockOk(createResult(taskId)));

    for (const state of states) {
      fetchMock.mockResolvedValueOnce(mockOk(statusResult(taskId, state)));
    }

    const assertion: Promise<void> = expect(publish(token)).rejects.toThrow(
      'failed to import role'
    );
    await jest.advanceTimersByTimeAsync(states.length * 5_000);
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(states.length + 1);
    expectPostCall(token, { user: owner, repo: repository });

    for (let i = 2; i <= states.length + 1; i++)
      expectGetCall(token, i, taskId);
  });

  it('throws when GITHUB_ACTION_REPOSITORY is not defined', async () => {
    process.env.GITHUB_ACTION_REPOSITORY = undefined;

    await expect(publish(token)).rejects.toThrow(
      'invalid value in GITHUB_ACTION_REPOSITORY'
    );

    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it('throws when GITHUB_ACTION_REPOSITORY is missing a slash', async () => {
    process.env.GITHUB_ACTION_REPOSITORY = 'owner-name';

    await expect(publish(token)).rejects.toThrow(
      'invalid value in GITHUB_ACTION_REPOSITORY'
    );

    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it('throws when create response has empty results', async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ results: [] }));

    await expect(publish(token)).rejects.toThrow(
      'the import response does not contain any results'
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expectPostCall(token, { user: owner, repo: repository });
  });

  it.each([400, 401, 500])(
    'throws when create request fails with %i',
    async (status) => {
      fetchMock.mockResolvedValueOnce(mockError(status));

      await expect(publish(token)).rejects.toThrow(
        `import task creation failed with status: ${status}`
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expectPostCall(token, { user: owner, repo: repository });
    }
  );

  it('throws when status response has empty results', async () => {
    const taskId = Math.floor(Math.random() * 9999999);

    fetchMock
      .mockResolvedValueOnce(mockOk(createResult(taskId)))
      .mockResolvedValueOnce(mockOk({ results: [] }));

    const assertion: Promise<void> = expect(publish(token)).rejects.toThrow(
      'the import response does not contain any results'
    );
    await jest.advanceTimersByTimeAsync(5_000);
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expectPostCall(token, { user: owner, repo: repository });
    expectGetCall(token, 2, taskId);
  });

  it.each([400, 401, 500])(
    'throws when status request fails with %i',
    async (status) => {
      const taskId = Math.floor(Math.random() * 9999999);

      fetchMock
        .mockResolvedValueOnce(mockOk(createResult(taskId)))
        .mockResolvedValueOnce(mockError(status));

      const assertion: Promise<void> = expect(publish(token)).rejects.toThrow(
        `failed to get import task with status: ${status}`
      );
      await jest.advanceTimersByTimeAsync(5_000);
      await assertion;

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expectPostCall(token, { user: owner, repo: repository });
      expectGetCall(token, 2, taskId);
    }
  );
});
