const jectableNames = new Set<PropertyKey>()
const mocks = new Map<PropertyKey, Function>()

/** The name-to-function map that consumers extend through module augmentation. */
export interface Jectables {}

type JectableImplementation<Name extends JectableName> = Jectables[Name]
type JectableName = {
  [Name in keyof Jectables]: Jectables[Name] extends Function ? Name : never
}[keyof Jectables]

/** Install or replace the mock for a registered name. */
export function inject<Name extends JectableName>(
  name: Name,
  implementation: JectableImplementation<Name>,
): void {
  mocks.set(name, implementation as Function)
}

/**
 * Create the stable function through which calls reach the real implementation
 * or the name's current mock.
 */
export function jectable<Name extends JectableName>(
  name: Name,
  implementation: JectableImplementation<Name>,
): JectableImplementation<Name> {
  if (jectableNames.has(name))
    throw new Error(`A jectable named ${String(name)} is already registered`)

  jectableNames.add(name)

  const wrapper = function(this: unknown, ...arguments_: unknown[]): unknown {
    const activeImplementation = mocks.get(name)
      ?? implementation as Function

    return Reflect.apply(activeImplementation, this, arguments_)
  }

  return wrapper as unknown as JectableImplementation<Name>
}

/** Remove a name's current mock. Future calls use its real implementation. */
export function reset<Name extends JectableName>(name: Name): void {
  mocks.delete(name)
}

/** Remove all current mocks. Future calls use their real implementations. */
export const resetAll = () => mocks.clear()
