type Stack = readonly unknown[];

// StackOp represents our primitive stack operations
type StackOp =
  | readonly ["push", unknown]
  | readonly ["pop"]
  | readonly ["dup"]
  | readonly ["swap"]
  | readonly ["add"]
  | readonly ["mul"]
  | readonly ["apply", (stack: Stack) => Stack];

// Operation results mapped to their operations
// Define return types for operations
type OperationReturnType = {
  push: Stack;
  pop: Stack;
  dup: Stack;
  swap: Stack;
  add: Stack;
  mul: Stack;
  apply: Stack;
};

// Map operation to its return type
type OperationResult<Op> = Op extends [infer T]
  ? T extends keyof OperationReturnType
    ? OperationReturnType[T]
    : never
  : never;

// Free monad implementation using tuples
type Pure<F, A> = ["pure", A];
type Impure<F, A> = ["impure", F, (x: OperationResult<F>) => Free<F, A>];
type Free<F, A> = Pure<F, A> | Impure<F, A>;

const pure = <F, A>(a: A): Free<F, A> => ["pure", a] as const;
const impure = <F, A>(
  fa: F,
  next: (x: OperationResult<F>) => Free<F, A>
): Free<F, A> => ["impure", fa, next] as const;

// Generic operation constructor
const makeOp =
  <T extends StackOp[0]>(type: T) =>
  (...args: T extends keyof OperationArgs ? [OperationArgs[T]] : []) =>
    impure([type, ...args] as const, (stack: Stack) => pure(stack));

// Type helper for operations with arguments
type OperationArgs = {
  push: unknown;
  apply: (stack: Stack) => Stack;
};

// Create all operations using the generic constructor
const push = makeOp("push");
const pop = makeOp("pop");
const dup = makeOp("dup");
const swap = makeOp("swap");
const add = makeOp("add");
const mul = makeOp("mul");
const apply = makeOp("apply");

// Monadic operations
const map = <F, A, B>(fa: Free<F, A>, f: (a: A) => B): Free<F, B> => {
  const [tag] = fa;
  switch (tag) {
    case "pure": {
      const [, ...rest] = fa;
      return pure(f(rest[0]));
    }
    case "impure": {
      const [, ...rest] = fa;
      const [value, next] = rest;
      return impure(value, (x) => map(next(x), f));
    }
  }
};

const flatMap = <F, A, B>(
  fa: Free<F, A>,
  f: (a: A) => Free<F, B>
): Free<F, B> => {
  const [tag] = fa;
  switch (tag) {
    case "pure": {
      const [, ...rest] = fa;
      return f(rest[0]);
    }
    case "impure": {
      const [, ...rest] = fa;
      const [value, next] = rest;
      return impure(value, (x) => flatMap(next(x), f));
    }
  }
};

// Stack interpreter
const interpreter = (initialStack: Stack = []) => {
  const interpret = async <A>(program: Free<StackOp, A>): Promise<A> => {
    const [tag] = program;
    switch (tag) {
      case "pure": {
        const [, result] = program;
        return result;
      }
      case "impure": {
        const [, ...rest] = program;
        const [op, next] = rest;
        let result: Stack;

        const [opName] = op;
        switch (opName) {
          case "push": {
            const [, item] = op;
            result = [item, ...initialStack];
            break;
          }

          case "pop": {
            const [, ...rest] = initialStack;
            result = rest;
            break;
          }

          case "dup": {
            const [top, ...restDup] = initialStack;
            result = [top, top, ...restDup];
            break;
          }

          case "swap": {
            const [a, b, ...restSwap] = initialStack;
            result = [b, a, ...restSwap];
            break;
          }

          case "add": {
            const [n1, n2, ...restAdd] = initialStack;
            result = [Number(n1) + Number(n2), ...restAdd];
            break;
          }

          case "mul": {
            const [m1, m2, ...restMul] = initialStack;
            result = [Number(m1) * Number(m2), ...restMul];
            break;
          }

          case "apply": {
            const [, f] = op;
            result = f(initialStack);
            break;
          }

          default: {
            result = initialStack;
          }
        }

        initialStack = result;
        return interpret(next(result as OperationResult<typeof op>));
      }
    }
  };

  return interpret;
};

// Higher-level combinators
const sequence = (
  ...operations: Free<StackOp, Stack>[]
): Free<StackOp, Stack> =>
  operations.reduce((acc, op) => flatMap(acc, (stack) => op), pure([]));

// Example: Define words (functions) as sequences of operations
const squared = sequence(dup(), mul());

const sum3 = sequence(add(), add());

// Example usage: Calculate (2 + 3) * 4
const program = sequence(push(2), push(3), add(), push(4), mul());

// Example: Factorial implementation
const factorial = (n: number): Free<StackOp, Stack> => {
  if (n <= 1) {
    return push(1);
  }

  return sequence(push(n), factorial(n - 1), mul());
};

// Examples showing composition
const complexProgram = sequence(push(5), squared, push(3), push(2), sum3);

// Custom word definitions
const define = (name: string, program: Free<StackOp, Stack>) => ({
  [name]: program,
});

const words = {
  ...define("squared", squared),
  ...define("sum3", sum3),
};

// Example of using the interpreter
const runExample = async () => {
  const interpret = interpreter();

  const test = interpreter([2]);
  console.log("squared:", await test(squared));

  console.log("Running (2 + 3) * 4:");
  const result1 = await interpret(program);
  console.log(result1);

  console.log("\nRunning 5 squared + 2 + 3:");
  const result2 = await interpret(complexProgram);
  console.log(result2);

  console.log("\nCalculating factorial of 5:");
  const result3 = await interpret(factorial(5));
  console.log(result3);
};

runExample();
