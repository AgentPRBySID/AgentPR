// dummy.ts

// 🤖 trigger lint & gpt
const foo: any = 'this should trigger no-explicit-any';
const unused = 42; // trigger no-unused-vars
const unusedVar = 123; // just testing


function testFunc() {
  if (false) {
    console.log('dead branch'); // trigger GPT suggestion
  }
}
