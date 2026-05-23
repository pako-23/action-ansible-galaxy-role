import * as core from '@actions/core';
import { publish } from './galaxy.js';

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token: string = core.getInput('token');

    await publish(token);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
    else core.setFailed('failed to publish role to ansible galaxy');
  }
}
