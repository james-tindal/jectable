import { describe, expect, expectTypeOf, it } from 'vite-plus/test'

import { inject, jectable, reset, resetAll } from '.'

type Receiver = { prefix: string }

declare module '.' {
  interface Jectables {
    add: (left: number, right: number) => number
    asynchronous: (value: number) => Promise<number>
    duplicate: () => string
    early: (value: string) => string
    fallible: () => number
    first: () => string
    object: { name: string; value: number }
    second: () => string
    singleton: () => { name: string }
    stable: (value: number) => number
    typed: (value: string) => number
    typedObject: { value: string }
    unmockAllFirst: () => string
    unmockAllSecond: () => string
    withThis: (this: Receiver, value: string) => string
  }
}

describe('jectable', () => {
  it('uses the real implementation by default', () => {
    const add = jectable('add', (left, right) => left + right)

    expect(add(2, 3)).toBe(5)
  })

  it('changes a captured wrapper when a mock is installed, replaced, and removed', () => {
    const stable = jectable('stable', value => value + 1)
    const captured = stable

    expect(captured(2)).toBe(3)

    inject('stable', value => value + 10)
    expect(captured(2)).toBe(12)

    inject('stable', value => value + 20)
    expect(captured(2)).toBe(22)

    reset('stable')
    expect(captured(2)).toBe(3)
  })

  it('allows a mock to be installed before its jectable is registered', () => {
    inject('early', value => `mock:${value}`)

    const early = jectable('early', value => `real:${value}`)

    expect(early('value')).toBe('mock:value')
    reset('early')
    expect(early('value')).toBe('real:value')
  })

  it('throws when the same jectable name is registered twice', () => {
    jectable('duplicate', () => 'first')

    expect(() => jectable('duplicate', () => 'second')).toThrowError(
      'A jectable named duplicate is already registered',
    )
  })

  it('assigns mocks to names', () => {
    const first = jectable('first', () => 'real first')
    const second = jectable('second', () => 'real second')

    inject('first', () => 'mock first')

    expect(first()).toBe('mock first')
    expect(second()).toBe('real second')
  })

  it('removes all current mocks', () => {
    const first = jectable('unmockAllFirst', () => 'real first')
    const second = jectable('unmockAllSecond', () => 'real second')

    inject('unmockAllFirst', () => 'mock first')
    inject('unmockAllSecond', () => 'mock second')

    resetAll()

    expect(first()).toBe('real first')
    expect(second()).toBe('real second')
  })

  it('changes an object proxy when a mock is installed, replaced, and removed', () => {
    const object = jectable('object', { name: 'real', value: 1 })

    expect(object.name).toBe('real')
    expect(object.value).toBe(1)

    inject('object', { name: 'first mock', value: 2 })
    expect(object.name).toBe('first mock')
    expect(object.value).toBe(2)

    inject('object', { name: 'second mock', value: 3 })
    expect(object.name).toBe('second mock')
    expect(object.value).toBe(3)

    reset('object')
    expect(object.name).toBe('real')
    expect(object.value).toBe(1)
  })

  it('uses one shared registry for singleton access', () => {
    const realSingleton = { name: 'real' }
    const mockedSingleton = { name: 'mocked' }
    const singleton = jectable('singleton', () => realSingleton)

    expect(singleton()).toBe(realSingleton)
    inject('singleton', () => mockedSingleton)
    expect(singleton()).toBe(mockedSingleton)
    expect(singleton()).toBe(mockedSingleton)
    reset('singleton')
    expect(singleton()).toBe(realSingleton)
  })

  it('preserves this for real and mocked implementations', () => {
    const withThis = jectable('withThis', function(value) {
      return `${this.prefix}:${value}`
    })

    expect(withThis.call({ prefix: 'real' }, 'value')).toBe('real:value')

    inject('withThis', function(value) {
      return `${this.prefix}:mock:${value}`
    })

    expect(withThis.call({ prefix: 'receiver' }, 'value')).toBe('receiver:mock:value')
  })
})

void function verifyTypes(): void {
  const typed = jectable('typed', value => value.length)
  const typedObject = jectable('typedObject', { value: 'real' })

  expectTypeOf(typed).toEqualTypeOf<(value: string) => number>()
  expectTypeOf(typedObject).toEqualTypeOf<{ value: string }>()

  // @ts-expect-error Unknown names are rejected.
  inject('missing', () => 'missing')

  // @ts-expect-error A mock must have the registered implementation type.
  inject('typed', (value: number) => value)

  // @ts-expect-error A real implementation must have the registered type.
  jectable('typed', (value: number) => value)

  // @ts-expect-error An object mock must have the registered implementation type.
  inject('typedObject', { value: 1 })

  // @ts-expect-error A real object must have the registered implementation type.
  jectable('typedObject', { value: 1 })

  // @ts-expect-error Only registered names can be removed.
  reset('missing')
}
