# Ansible Galaxy Roles GitHub Action

[Linter]
[CI]
[Check dist/]
[CodeQL]
[Coverage]

A GitHub Action to publish [Ansible] roles to [Ansible Galaxy].

## Inputs

| Input | Description | Default |
|-------|-------------|:-------:|
| `token` | The Ansible Galaxy API key which can be found at [https://galaxy.ansible.com/me/preferences](https://galaxy.ansible.com/me/preferences). | |

## Usage

To publish your Ansible role to Ansible Galaxy, add the following step
to your workflow. This action will use the current repository to
publish the role. In particular, it will detect the repository owner
and name from the default [GitHub variables].

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v6

  - name: Publish role to Ansible Galaxy
    id: publish
    uses: pako-23/action-ansible-galaxy-role@v0
    with:
      token: ${{ secrets.ANSIBLE_GALAXY_TOKEN }}
```


## License

[MIT]

[ansible]:
  https://docs.ansible.com/projects/ansible/latest/getting_started/introduction.html
[ansible galaxy]:
  https://galaxy.ansible.com/ui/
[mit]:
  LICENSE
[linter]:
  https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg
[ci]:
  https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg
[check dist/]:
  https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg
[codeql]:
  https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg
[coverage]:
  badges/coverage.svg
[github variables]:
  https://docs.github.com/en/actions/reference/workflows-and-actions/variables
