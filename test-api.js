import "dotenv/config";
import assert from "assert";
import { spawn } from "child_process";
import mongoose from "mongoose";
const BASE_URL = "http://localhost:5000";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/data-hub";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function isServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
async function clearDatabase() {
  try {
    console.log("Connecting to MongoDB to clean database...");
    await mongoose.connect(MONGODB_URI);
    const collections = await mongoose.connection.db.listCollections({ name: "posts" }).toArray();
    if (collections.length > 0) {
      await mongoose.connection.db.collection("posts").deleteMany({});
      console.log("Database posts collection cleared.");
    } else {
      console.log("No posts collection found, skipping clear.");
    }
    await mongoose.disconnect();
  } catch (error) {
    console.warn("Warning: Could not clean database before test:", error.message);
  }
}

async function runTests() {
  console.log("Starting API integration tests with MongoDB...\n");
  await clearDatabase();

  let serverProcess = null;
  try {
    const alreadyRunning = await isServerRunning();
    if (!alreadyRunning) {
      console.log("Starting server automatically for integration tests...");
      serverProcess = spawn("node", ["server.js"], {
        stdio: "inherit"
      });

      let retries = 30;
      while (retries > 0) {
        await sleep(100);
        if (await isServerRunning()) {
          break;
        }
        retries--;
      }

      if (retries === 0) {
        throw new Error("Failed to start server automatically. Make sure server.js can start on port 5000.");
      }
      console.log("Server started successfully. Running tests...\n");
    } else {
      console.log("Server is already running. Running tests...\n");
    }

    console.log("Testing GET / (Server info)...");
    const infoRes = await fetch(`${BASE_URL}/`);
    assert.strictEqual(infoRes.status, 200);

    const infoData = await infoRes.json();
    assert.ok(infoData.message);
    assert.strictEqual(infoData.project, "The Data Hub");
    assert.strictEqual(infoData.totalPosts, 0);
    console.log("GET / passed.\n");
    console.log("Testing GET /posts (Initial empty array)...");
    const getInitialRes = await fetch(`${BASE_URL}/posts`);
    assert.strictEqual(getInitialRes.status, 200);
    const initialPosts = await getInitialRes.json();
    assert.ok(Array.isArray(initialPosts));
    assert.strictEqual(initialPosts.length, 0);
    console.log("GET /posts (initial) passed.\n");
    console.log("Testing POST /posts (Create post)...");
    const postPayload = {
      title: "Exploring Node.js & Express with MongoDB",
      content: "Building a RESTful API Server with MongoDB Atlas and Mongoose ODM.",
    };
    const postRes = await fetch(`${BASE_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postPayload),
    });
    assert.strictEqual(postRes.status, 201);
    const postResult = await postRes.json();
    assert.ok(postResult.post.id);
    assert.strictEqual(postResult.post.title, postPayload.title);
    assert.strictEqual(postResult.post.content, postPayload.content);
    const postId = postResult.post.id;
    console.log(`POST /posts passed. Created Post ID: ${postId}\n`);

    console.log("Testing GET /posts (Verify post exists)...");
    const getAfterPostRes = await fetch(`${BASE_URL}/posts`);
    assert.strictEqual(getAfterPostRes.status, 200);
    const postsAfterPost = await getAfterPostRes.json();
    assert.strictEqual(postsAfterPost.length, 1);
    assert.strictEqual(postsAfterPost[0].id, postId);
    console.log("GET /posts (after creation) passed.\n");
    console.log(`Testing GET /posts/${postId} (Retrieve single post)...`);
    const getSingleRes = await fetch(`${BASE_URL}/posts/${postId}`);
    assert.strictEqual(getSingleRes.status, 200);
    const singlePost = await getSingleRes.json();
    assert.strictEqual(singlePost.id, postId);
    assert.strictEqual(singlePost.title, postPayload.title);
    console.log("GET /posts/:id passed.\n");
    console.log(`Testing PUT /posts/${postId} (Update post)...`);
    const updatePayload = {
      title: "Exploring Node.js & Express with MongoDB (Updated)",
    };
    const putRes = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatePayload),
    });
    assert.strictEqual(putRes.status, 200);
    const putResult = await putRes.json();
    assert.strictEqual(
      putResult.post.title,
      "Exploring Node.js & Express with MongoDB (Updated)"
    );
    assert.strictEqual(
      putResult.post.content,
      postPayload.content
    );
    console.log("PUT /posts/:id passed.\n");
    console.log(`Testing DELETE /posts/${postId} (Delete post)...`);
    const deleteRes = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: "DELETE",
    });
    assert.strictEqual(deleteRes.status, 200);
    console.log("DELETE /posts/:id passed.\n");
    console.log(`Testing GET /posts/${postId} (Verify 404 after delete)...`);
    const getNotFoundRes = await fetch(
      `${BASE_URL}/posts/${postId}`
    );
    assert.strictEqual(getNotFoundRes.status, 404);
    console.log("GET /posts/:id (404 check) passed.\n");

    console.log("Testing GET /posts (Verify database is empty)...");
    const getFinalRes = await fetch(`${BASE_URL}/posts`);
    const finalPosts = await getFinalRes.json();
    assert.strictEqual(finalPosts.length, 0);
    console.log("GET /posts (final verification) passed.\n");

    console.log("All API integration tests passed successfully!");
  } catch (error) {
    console.error("Integration test failed with error:");
    console.error(error);
    if (serverProcess) {
      console.log("Shutting down the spawned server...");
      serverProcess.kill("SIGTERM");
    }
    process.exit(1);
  } finally {
    if (serverProcess) {
      console.log("Cleaning up: shutting down the automatically spawned server...");
      serverProcess.kill("SIGTERM");
    }
  }
}
runTests();