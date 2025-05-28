// dummy.ts

// 🤖 trigger lint & gpt
// test trigger for GPT Review
const foo = 42;

const unused = 42; // trigger no-unused-vars
const unusedVar = 123; // just testing


function testFunc() {
  if (false) {
    console.log('dead branch'); // trigger GPT suggestion
  }
}
