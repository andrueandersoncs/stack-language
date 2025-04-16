# Stack Language

A stack-based programming language and interpreter built with Free Monads in TypeScript.

## Overview

This project implements a stack-based language inspired by Forth, Joy, and other concatenative programming languages. It defines a small set of primitive operations and provides a composable way to build more complex operations using free monads.

## Features

- Pure functional implementation using free monads
- Stack-based operations (push, pop, dup, swap, add, mul)
- Higher-order functions and combinators
- Composition of operations into reusable "words"
- Clean separation between the language definition and interpreter

## Example

```typescript
// Define a simple factorial program
const factorial = (n: number): Free<StackOp, Stack> => {
  if (n <= 1) {
    return push(1);
  }
  return sequence(push(n), factorial(n - 1), mul());
};

// Calculate (2 + 3) * 4
const calculation = sequence(push(2), push(3), add(), push(4), mul());

// Run the interpreter
const interpret = interpreter();
const result = await interpret(calculation); // Returns [20]
```

## Core Operations

- `push(x)`: Push value x onto the stack
- `pop()`: Remove the top value from the stack
- `dup()`: Duplicate the top value on the stack
- `swap()`: Swap the top two values on the stack
- `add()`: Pop two values, push their sum
- `mul()`: Pop two values, push their product
- `apply(f)`: Apply a custom function to the stack

## Combinators

The language provides combinators for creating more complex operations:

```typescript
// Square a number (duplicate and multiply)
const squared = sequence(dup(), mul());

// Sum three numbers
const sum3 = sequence(add(), add());
```

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

## License

ISC
