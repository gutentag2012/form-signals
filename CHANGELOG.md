## 0.4.5 (2024-11-10)

### 🩹 Fixes

- wrong copy of date objects ([b6787c2](https://github.com/gutentag2012/form-signals/commit/b6787c2))

## 0.4.4 (2024-11-10)

### 🩹 Fixes

- change submit return to allow all values ([232a8d7](https://github.com/gutentag2012/form-signals/commit/232a8d7))

## 0.4.3 (2024-10-26)

### 🩹 Fixes

- unmounted fields not being removed from the form ([80dae36](https://github.com/gutentag2012/form-signals/commit/80dae36))
- add option to keep fields in form even if they are unmounted ([f2a3f2e](https://github.com/gutentag2012/form-signals/commit/f2a3f2e))
- **examples:** update package versions from workspace to explicit npm versions ([309c881](https://github.com/gutentag2012/form-signals/commit/309c881))

## 0.4.2 (2024-08-24)


### 🩹 Fixes

- elements returning jsx elements instead of react nodes ([a38dd87](https://github.com/gutentag2012/form-signals/commit/a38dd87))
- add npmignore to reduce package size ([70f3199](https://github.com/gutentag2012/form-signals/commit/70f3199))

## 0.4.1 (2024-08-19)


### 🩹 Fixes

- move default entry file to last place to resolve nextjs error ([0ff0855](https://github.com/gutentag2012/form-signals/commit/0ff0855))

## 0.4.0 (2024-06-18)


### 🚀 Features

- **form-core:** allow files as a deep signalify exception similar to dates ([7c6ac75](https://github.com/gutentag2012/form-signals/commit/7c6ac75))
- **form-core:** add transform buffer to bridge invalid transformations ([ffe09b5](https://github.com/gutentag2012/form-signals/commit/ffe09b5))

### 🩹 Fixes

- **form-core:** transform signal not doing finegrained updates ([54d7d16](https://github.com/gutentag2012/form-signals/commit/54d7d16))
- **form-core:** form validation skipping if fields without default values are registered ([564eb8a](https://github.com/gutentag2012/form-signals/commit/564eb8a))
- **form-core:** onSubmit validation running debounce ([0b26e7a](https://github.com/gutentag2012/form-signals/commit/0b26e7a))
- **form-core:** array not being marked as dirty when adding or removing values ([82827e7](https://github.com/gutentag2012/form-signals/commit/82827e7))
- **form-core:** creation of form group mutating members array ([e5432e0](https://github.com/gutentag2012/form-signals/commit/e5432e0))
- **form-react:** field group rerendering too much because members array is recognized as changed even though it hasnt ([eca1d7a](https://github.com/gutentag2012/form-signals/commit/eca1d7a))
- **form-react:** allow to manage mounted state by a different source than the hooks ([9ce5206](https://github.com/gutentag2012/form-signals/commit/9ce5206))

## 0.3.1 (2024-05-27)


### 🩹 Fixes

- **form-core:** field transform function changes not being recognized ([09488cf](https://github.com/gutentag2012/form-signals/commit/09488cf))

## 0.3.0 (2024-05-27)


### 🚀 Features

- **form-core:** keep unmounted values by default ([a551942](https://github.com/gutentag2012/form-signals/commit/a551942))
- **form-core:** allow to validate unmounted fields on form ([6bf6c72](https://github.com/gutentag2012/form-signals/commit/6bf6c72))

### 🩹 Fixes

- **dev-tools-react:** css reset ([08a4d44](https://github.com/gutentag2012/form-signals/commit/08a4d44))
- **form-core:** ignore undefined field values for equality ([1fe72c0](https://github.com/gutentag2012/form-signals/commit/1fe72c0))
- **form-core:** deep signalisation of arrays ([0e27a32](https://github.com/gutentag2012/form-signals/commit/0e27a32))
- **form-core:** default values overwriting existing form values ([a9e0bf0](https://github.com/gutentag2012/form-signals/commit/a9e0bf0))
- **form-core:** combination of default values ([e611a62](https://github.com/gutentag2012/form-signals/commit/e611a62))
- **form-core:** unmounted fields being ignored for default values ([a53c9d7](https://github.com/gutentag2012/form-signals/commit/a53c9d7))
- **form-core:** errors clearing for unmounted fields on change ([ba0a5c3](https://github.com/gutentag2012/form-signals/commit/ba0a5c3))
- **form-core:** handle change not changing the base object ([83d173f](https://github.com/gutentag2012/form-signals/commit/83d173f))
- **form-react:** construction of FieldProvider on field group ([9bf95bf](https://github.com/gutentag2012/form-signals/commit/9bf95bf))
- **form-react:** binding of handleChangeBound function ([ef65472](https://github.com/gutentag2012/form-signals/commit/ef65472))

## 0.2.1 (2024-05-24)


### 🩹 Fixes

- **dev-tools-react:** Update form-react dependency version ([93e5a31](https://github.com/gutentag2012/form-signals/commit/93e5a31))

## 0.2.0 (2024-05-24)


### 🚀 Features

- **dev-tools-react:** Show disabled state in dev tools ([d660880](https://github.com/gutentag2012/form-signals/commit/d660880))
- **dev-tools-react:** Add field group state to dev tools ([58184ac](https://github.com/gutentag2012/form-signals/commit/58184ac))
- **form-core:** Add ability to disable fields and form ([624e7cb](https://github.com/gutentag2012/form-signals/commit/624e7cb))
- **form-core:** add field groups ([e193d4d](https://github.com/gutentag2012/form-signals/commit/e193d4d))
- **form-react:** Add field groups to react bindings ([055215b](https://github.com/gutentag2012/form-signals/commit/055215b))

### 🩹 Fixes

- **form-core:** Reset values not taking field default values into account ([165d7c3](https://github.com/gutentag2012/form-signals/commit/165d7c3))
- **form-core:** mounted state being ignored for field array + object helpers ([2e59628](https://github.com/gutentag2012/form-signals/commit/2e59628))
- **form-react:** Make sure to only update form and field options within a layout effect ([e7ee994](https://github.com/gutentag2012/form-signals/commit/e7ee994))
- **form-react:** Submit binding ([db77152](https://github.com/gutentag2012/form-signals/commit/db77152))
- **signals:** Fix signal retrieval for empty signals ([31298b0](https://github.com/gutentag2012/form-signals/commit/31298b0))

## 0.1.3 (2024-04-18)


### 🩹 Fixes

- Add dev-tools-react to release ([4b578b9](https://github.com/gutentag2012/form-signals/commit/4b578b9))

## 0.1.2 (2024-04-18)


### 🩹 Fixes

- **form-core:** Fix child fields not being unregistered when parent is unregistered + remove fields if their value is removed through helper methods ([e2d3e93](https://github.com/gutentag2012/form-signals/commit/e2d3e93))
- **form-core:** Fix incorrect default value used within form based on fields ([5b0c92a](https://github.com/gutentag2012/form-signals/commit/5b0c92a))

## 0.1.1 (2024-04-18)


### 🚀 Features

- **dev-tools-react:** Add dev tools for the React bindings ([378b635](https://github.com/gutentag2012/form-signals/commit/378b635))

### 🩹 Fixes

- **form-core:** Fix FormLogic.updateOptions not allowing to delete fields + array items through new default values ([719318a](https://github.com/gutentag2012/form-signals/commit/719318a))
- **form-react:** Fix form options not being optional ([c4f958f](https://github.com/gutentag2012/form-signals/commit/c4f958f))

## 0.1.0 (2024-04-06)


### 🚀 Features

- **form-core:** Add ability to set errors manually ([552c90e](https://github.com/gutentag2012/form-signals/commit/552c90e))
- **form-core:** Add transformer to convert zod issues to errors consumable by the addError method during submission ([e79c100](https://github.com/gutentag2012/form-signals/commit/e79c100))
- **form-core:** Add ability addErrors during submission ([ff856ed](https://github.com/gutentag2012/form-signals/commit/ff856ed))

## 0.0.13 (2024-04-06)


### 🩹 Fixes

- Fix package.json formats ([e03ae04](https://github.com/gutentag2012/form-signals/commit/e03ae04))
- Always auth for npm ([b0e7e4c](https://github.com/gutentag2012/form-signals/commit/b0e7e4c))
- Add additional auth token alias + add registry url ([f4cd4a4](https://github.com/gutentag2012/form-signals/commit/f4cd4a4))

## 0.0.12 (2024-04-06)


### 🩹 Fixes

- Add debug information to nx release ([75444ee](https://github.com/gutentag2012/form-signals/commit/75444ee))

## 0.0.11 (2024-04-06)


### 🩹 Fixes

- **form-core:** Change README.md to trigger release ([4ce47ce](https://github.com/gutentag2012/form-signals/commit/4ce47ce))

## 0.0.10 (2024-04-06)


### 🩹 Fixes

- Fix nx release not parsing output correctly ([63a4262](https://github.com/gutentag2012/form-signals/commit/63a4262))

## 0.0.9 (2024-04-06)


### 🩹 Fixes

- **form-core:** Change README.md to trigger release ([4b2723f](https://github.com/gutentag2012/form-signals/commit/4b2723f))

## 0.0.8 (2024-04-06)


### 🩹 Fixes

- **form-core:** Change README.md to trigger release ([ae85776](https://github.com/gutentag2012/form-signals/commit/ae85776))

## 0.0.7 (2024-04-05)


### 🩹 Fixes

- Remove git option for version step ([f4f49a3](https://github.com/gutentag2012/form-signals/commit/f4f49a3))
- Remove changelogs of packages ([2a4e125](https://github.com/gutentag2012/form-signals/commit/2a4e125))

## 0.0.6 (2024-04-05)

This was a version bump only, there were no code changes.

## 0.0.5 (2024-04-05)


### 🩹 Fixes

- **form-core:** Move todo up ([ec32d35](https://github.com/gutentag2012/form-signals/commit/ec32d35))

## 0.0.4 (2024-04-05)


### 🩹 Fixes

- Fix build errors ([460b765](https://github.com/gutentag2012/form-signals/commit/460b765))
