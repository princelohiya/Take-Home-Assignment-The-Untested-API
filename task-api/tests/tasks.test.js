const request = require("supertest");
const app = require("../src/app");
const taskService = require("../src/services/taskService");

describe("Tasks API Integration", () => {
  beforeEach(() => taskService._reset());

  // Happy Path
  it("GET /tasks should return all tasks", async () => {
    taskService.create({ title: "Integration Task" });
    const res = await request(app).get("/tasks");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1); // If 1 is created
  });

  // Edge Case 1: Validation Error
  it("POST /tasks should return 400 for invalid status", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "Bad Status", status: "waiting" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("status must be one of");
  });

  // Edge Case 2: 404 for non-existent task
  it("PUT /tasks/:id should return 404 if ID is missing", async () => {
    const res = await request(app)
      .put("/tasks/invalid-uuid")
      .send({ title: "New" });
    expect(res.statusCode).toBe(404);
  });
});

describe("Validation Edge Cases", () => {
  it("should return 400 if title is just whitespace", async () => {
    const res = await request(app).post("/tasks").send({ title: "   " });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe(
      "title is required and must be a non-empty string",
    );
  });

  it("should return 400 if priority is invalid", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "Task", priority: "urgent" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("priority must be one of");
  });

  it("should return 400 if dueDate is not a valid date", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "Task", dueDate: "yesterday" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("dueDate must be a valid ISO date string");
  });

  it("should return 500 if the service throws an unexpected error", async () => {
    // We temporarily "break" the getAll function
    const originalGetAll = taskService.getAll;
    taskService.getAll = () => {
      throw new Error("Database Crash");
    };

    const res = await request(app).get("/tasks");
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Internal server error");

    // Restore it so other tests don't fail!
    taskService.getAll = originalGetAll;
  });
  it("should fail validation for every field", async () => {
    // Triggers line 17 (Empty title)
    const res1 = await request(app).post("/tasks").send({ title: "" });
    expect(res1.statusCode).toBe(400);

    // Triggers line 22 (Invalid Status)
    const res2 = await request(app)
      .post("/tasks")
      .send({ title: "X", status: "wrong" });
    expect(res2.statusCode).toBe(400);

    // Triggers line 25 (Invalid Priority)
    const res3 = await request(app)
      .post("/tasks")
      .send({ title: "X", priority: "none" });
    expect(res3.statusCode).toBe(400);

    // Triggers line 28 (Invalid Date)
    const res4 = await request(app)
      .post("/tasks")
      .send({ title: "X", dueDate: "invalid-date" });
    expect(res4.statusCode).toBe(400);
  });
});

describe("CRUD Edge Cases", () => {
  it("PUT should return 404 for invalid ID", async () => {
    const res = await request(app).put("/tasks/fake-id").send({ title: "New" });
    expect(res.statusCode).toBe(404);
  });

  it("DELETE should return 404 for invalid ID", async () => {
    const res = await request(app).delete("/tasks/fake-id");
    expect(res.statusCode).toBe(404);
  });

  it("PATCH complete should return 404 for invalid ID", async () => {
    const res = await request(app).patch("/tasks/fake-id/complete");
    expect(res.statusCode).toBe(404);
  });
});

describe("Advanced Route Tests", () => {
  // Covers lines 10-11 (GET /stats)
  it("GET /tasks/stats should return task statistics", async () => {
    const res = await request(app).get("/tasks/stats");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("todo");
  });

  // Covers lines 18-19 (Filter by status)
  it("GET /tasks?status=todo should filter tasks", async () => {
    taskService.create({ title: "Filter Me", status: "todo" });
    const res = await request(app).get("/tasks?status=todo");
    expect(res.statusCode).toBe(200);
    expect(res.body[0].status).toBe("todo");
  });

  // Covers lines 46 & 54 (Success PUT & DELETE)
  it("should update and then delete a task", async () => {
    const task = taskService.create({ title: "To be changed" });

    // Update (PUT)
    const updateRes = await request(app)
      .put(`/tasks/${task.id}`)
      .send({ title: "Updated" });
    expect(updateRes.statusCode).toBe(200);

    // Delete (DELETE)
    const deleteRes = await request(app).delete(`/tasks/${task.id}`);
    expect(deleteRes.statusCode).toBe(204);
  });
});
