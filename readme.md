# jectable

Mock without dependency injection or module mocking

❌  Module mocking
❌  Dependency injection
✅  Ergonomic mocking


## Install

```sh
pnpm add jectable
```


## Define jectables

Add each injectable name and type to the `Jectables` interface to restrict what can be passed to `inject()`.

```ts
import { jectable } from 'jectable'

declare module 'jectable' {
  interface Jectables {
    getUser: typeof getUser
    settings: typeof settings
  }
}

export const getUser = jectable('getUser', async id => {
  return { id, name: 'Alice' }
})

export const settings = jectable('settings', {
  apiUrl: 'https://example.com',
})
```


## Apply mocks

Use `inject()` to install or replace a mock.

```ts
import { inject, reset, resetAll } from 'jectable'

inject('getUser', async id => ({ id, name: 'Test user' }))
inject('settings', { apiUrl: 'http://localhost:3000' })

reset('getUser')
resetAll()
```
