# tango-verifier

```sh
npm i tango-verifier
```

## simple example

```ts

const req = {
    body: {
        userId: 'foobar',
        age: 20,
    }
};

// in context
await constraint(req.body, {
    userName: isString,
    age: isNumber,
}, true);

```

## complex example

```ts

// change throwed object
setErrorCreator(message => {
    return {
        message: message
    }
});

const req = {
    body: {
        userId: '2455',
        userName: 'foobar',
        age: 20,
        langs: ['ja', 'en'],
        data: {
            height: 180,
            weight: 70,
            food: 'apple',
        }
    }
};

// in context
await constraint(req.body, {
    userId: and(isString, isNumber),
    userName: isStringRange(1, 20),
    langs: isArrayOf(isString),
    data: {
        height: isNumber,
        weight: isNumber,
        food: isString
    },
    age: isNumberRange(0, 150)
});
```

## operators

```ts
// basic verifiers
notNull(a: any, name: string);
isString(a: any, name: string);
isNumber(a: any, name: string);
isInteger(a: string, name: string);
notNullString(a: any, name: string);
isArray(a: any, name: string);

// verifier generators
isStringRange(min: number, max: number);
isNumberRange(min: number, max: number);
matchRegex(regex: RegExp);
isArrayOf(child: Verifier);
or(...vs: Verifier[]);
and(...vs: Verifier[]);
not(v: Verifier);

// high-level functions
constraint(data: any, allow: any = {}, extra: boolean = false);
verifyParams(req: Request, allow: any);
```