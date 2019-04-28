# runcells_ext

An extension to JupyterLab that will allow users to specify specific cell execution paths.


## Prerequisites

* JupyterLab

## Installation

```bash
jupyter labextension install runcells_ext
```

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
npm run build
jupyter labextension link .
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```

