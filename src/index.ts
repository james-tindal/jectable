const jectableNames = new Set<PropertyKey>()
const mocks = new Map<PropertyKey, object>()

/** The name-to-function map that consumers extend through module augmentation. */
export interface Jectables {}

type JectableName = {
  [Name in keyof Jectables]: Jectables[Name] extends object ? Name : never
}[keyof Jectables]
type MockImplementation<Name extends JectableName> = Jectables[Name]

/** Install or replace the mock for a registered name. */
export function inject<Name extends JectableName>(
  name: Name,
  implementation: MockImplementation<Name>,
): void {
  mocks.set(name, implementation)
}

/**
 * Create the stable function through which calls reach the real implementation
 * or the name's current mock.
 */
export function jectable<Name extends PropertyKey, Implementation extends object>(
  name: Name,
  implementation: Implementation,
): Implementation {
  if (jectableNames.has(name))
    throw new Error(`A jectable named ${String(name)} is already registered`)

  jectableNames.add(name)

  const getActiveImplementation = (): object =>
    mocks.get(name) ?? implementation as object

  return new Proxy(implementation as object, {
    apply(_target, thisArgument, argumentsList) {
      return Reflect.apply(
        getActiveImplementation() as Function,
        thisArgument,
        argumentsList,
      )
    },
    get(_target, property) {
      const activeImplementation = getActiveImplementation()
      return Reflect.get(activeImplementation, property, activeImplementation)
    },
  }) as Implementation
}

/** Remove a name's current mock. Future calls use its real implementation. */
export function reset<Name extends JectableName>(name: Name): void {
  mocks.delete(name)
}

/** Remove all current mocks. Future calls use their real implementations. */
export const resetAll = () => mocks.clear()
