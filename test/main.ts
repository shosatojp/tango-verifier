import { isString, constraint, isNumber, matchRegex, isStringRange, isArrayOf, or, isArray, and, isEmailAddress } from '../src';

async function test(promise: Promise<void>, expectedResult: boolean = true) {
    promise.then(() => {
        if (!expectedResult) console.log('failed');
    }).catch(() => {
        if (expectedResult) console.log('failed');
    });
}

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
        },
        emailAddress: 'hogehoge+ho@example.com'
    }
};



// usage
(async () => {

    await constraint(req.body, {
        userName: isString,
        age: isNumber,
    }, true);

    await constraint(req.body, {
        userId: and(isString, isNumber),
        userName: isStringRange(1, 20),
        langs: isArrayOf(isString),
        data: {
            height: isNumber,
            weight: isNumber,
            food: isString
        },
        age: isNumber,
        emailAddress: isEmailAddress
    });


})().then(data => console.log(data)).catch(err => console.log(err));