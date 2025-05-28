// dummy.ts

// 🤖 trigger lint & gpt
const foo: any = 'this should trigger no-explicit-any';
const unused = 42; // trigger no-unused-vars

function testFunc() {
  if (false) {
    console.log('dead branch'); // trigger GPT suggestion
  }
}
