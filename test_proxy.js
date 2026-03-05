const { PrismaClient } = require('@prisma/client');
const client = new PrismaClient();
const proxy = new Proxy({}, {
  get(_, prop) { return client[prop]; }
});
async function main() {
  try {
    await proxy.post.findFirst();
    console.log("Success");
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
