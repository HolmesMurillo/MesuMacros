import assert from "node:assert/strict";
import { loadData, saveData } from "../src/services/storage.js";
const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) || null,
  setItem: (key, value) => values.set(key, value),
};
const a = loadData("account-a");
a.profile.name = "Account A";
a.foods.push({ id: "test-a" });
saveData(a, "account-a");
assert.equal(loadData("account-a").profile.name, "Account A");
assert.equal(loadData("account-b").profile.name, "");
assert.deepEqual(loadData("account-b").foods, []);
saveData(a); // legacy storage cannot leak into a named account
assert.deepEqual(loadData("account-b").foods, []);
saveData(loadData("account-b"), "account-b");
assert.equal(loadData("account-a").foods.length, 1);
localStorage.setItem("mesumacros:data:v1:account-b", "broken json");
assert.deepEqual(loadData("account-b").foods, []);
localStorage.setItem = () => { throw new Error("quota exceeded"); };
assert.equal(saveData(a, "account-a"), false);
console.log("Account caches isolated; legacy, invalid JSON and storage failures tested.");
