/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals';
import * as core from '../__fixtures__/core.js';
import { publish } from '../__fixtures__/galaxy.js';

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core);
jest.unstable_mockModule('../src/galaxy.js', () => ({ publish }));

const { run } = await import('../src/main.js');

describe('main.ts', () => {
  const token: string = Math.random().toString(36).substring(2);

  beforeEach(() => {
    core.getInput.mockImplementation(() => token);

    publish.mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('publishes the role to galaxy', async () => {
    await run();

    expect(publish).toHaveBeenCalledWith(token);
  });

  it('sets failed status', async () => {
    const error: Error = new Error(
      'not authorized to publish to ansible galaxy registry'
    );

    publish.mockClear().mockRejectedValueOnce(error);

    await run();

    expect(core.setFailed).toHaveBeenNthCalledWith(1, error.message);
  });

  it('sets default failed status', async () => {
    publish.mockClear().mockRejectedValueOnce(3);

    await run();

    expect(core.setFailed).toHaveBeenNthCalledWith(
      1,
      'failed to publish role to ansible galaxy'
    );
  });
});
