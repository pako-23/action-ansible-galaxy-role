# Ansible Galaxy Roles GitHub Action

[![Latest Release](https://img.shields.io/github/v/release/pako-23/action-ansible-galaxy-role?sort=semver)](https://github.com/pako-23/action-ansible-galaxy-role/releases/latest)
![Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)
![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)
![Coverage](./badges/coverage.svg)

A GitHub Action to publish [Ansible] roles to [Ansible Galaxy].

## Inputs

| Input   | Description                 | Default |
| ------- | --------------------------- | :-----: |
| `token` | The Ansible Galaxy API key. |         |

## Usage

To publish your Ansible role to Ansible Galaxy, add the following step to your
workflow. This action will use the current repository to publish the role. In
particular, it will detect the repository owner and name from the default
[GitHub variables].

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
[ansible galaxy]: https://galaxy.ansible.com/ui/
[mit]: LICENSE
[github variables]:
  https://docs.github.com/en/actions/reference/workflows-and-actions/variables
