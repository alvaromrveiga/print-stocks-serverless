async function hello() {
  console.log("Hello world");

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello TS!" }),
  };
}

export const handler = hello;
