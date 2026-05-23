import * as core from '@actions/core';

const waitInterval: number = 5_000;

interface ImportTask {
  id: string;
  github_user: string;
  github_repo: string;
}

enum ImportTaskState {
  WAITING = 'WAITING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

interface ImportTaskStatus {
  id: string;
  state: ImportTaskState;
}

interface ImportResponse<T> {
  results: T[];
}

async function unmarshalImportResponse<T>(
  response: Response
): Promise<ImportResponse<T>> {
  const text: string = await response.text();

  const importResponse: ImportResponse<T> = JSON.parse(
    text.replaceAll(/("id":\s*)(\d+)(,)/g, '$1"$2",')
  );
  if (importResponse.results.length === 0)
    throw new Error('the import response does not contain any results');

  return importResponse;
}

async function createImportTask(
  token: string,
  user: string,
  repo: string
): Promise<ImportTask> {
  const response = await fetch('https://galaxy.ansible.com/api/v1/imports/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`
    },
    body: JSON.stringify({ user, repo })
  });

  if (!response.ok)
    throw new Error(
      `import task creation failed with status: ${response.status}`
    );

  const {
    results: [task]
  }: ImportResponse<ImportTask> = await unmarshalImportResponse(response);

  return task;
}

async function getImportTaskStatus(
  token: string,
  id: string
): Promise<ImportTaskStatus> {
  const response = await fetch(
    `https://galaxy.ansible.com/api/v1/imports?id=${id}`,
    {
      method: 'GET',
      headers: { Authorization: `Token ${token}` }
    }
  );

  if (!response.ok)
    throw new Error(
      `failed to get import task with status: ${response.status}`
    );

  const {
    results: [status]
  }: ImportResponse<ImportTaskStatus> = await unmarshalImportResponse(response);

  return status;
}

export async function publish(token: string): Promise<void> {
  const [owner, repository] = (
    process.env.GITHUB_ACTION_REPOSITORY ?? ''
  ).split('/');

  if (owner === undefined || repository === undefined)
    throw new Error('invalid value in GITHUB_ACTION_REPOSITORY');

  const { id, github_user, github_repo } = await createImportTask(
    token,
    owner,
    repository
  );

  core.debug(`started import task with identifier ${id}`);
  core.debug(`import task GitHub user is ${github_user}`);
  core.debug(`import task GitHub repo is ${github_repo}`);

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, waitInterval));
    const { state } = await getImportTaskStatus(token, id);

    if (state === ImportTaskState.SUCCESS) {
      core.info('successfully uploadeded role');
      return;
    } else if (state === ImportTaskState.FAILED) {
      throw new Error('failed to import role');
    }

    core.debug('import not finished yet, waiting...');
  }
}
