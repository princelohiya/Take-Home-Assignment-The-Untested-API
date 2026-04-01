const taskService = require("../src/services/taskService");

describe("Task Service Unit Tests", () => {
  beforeEach(() => taskService._reset());

  it("should create a task with default values", () => {
    const task = taskService.create({ title: "Unit Test" });
    expect(task.title).toBe("Unit Test");
    expect(task.status).toBe("todo");
    expect(task.priority).toBe("medium");
  });

  it("should correctly paginate tasks (Page 1)", () => {
    for (let i = 1; i <= 5; i++) taskService.create({ title: `Task ${i}` });

    const page1 = taskService.getPaginated(1, 2);
    // BUG ALERT: If this fails, it's because of the (page * limit) logic!
    expect(page1[0].title).toBe("Task 1");
  });

  it("should identify overdue tasks in stats", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    taskService.create({
      title: "Late",
      dueDate: pastDate.toISOString(),
      status: "todo",
    });
    const stats = taskService.getStats();
    expect(stats.overdue).toBe(1);
  });

  it("should return false when removing a non-existent task", () => {
    const result = taskService.remove("non-existent-id");
    expect(result).toBe(false);
  });

  it("should return null when updating a non-existent task", () => {
    const result = taskService.update("non-existent-id", { title: "updated" });
    expect(result).toBeNull();
  });
});

describe("Service Edge Cases", () => {
  it("should successfully update an existing task", () => {
    const task = taskService.create({ title: "Old Title" });
    const updated = taskService.update(task.id, { title: "New Title" });
    expect(updated.title).toBe("New Title");
  });

  it("should successfully remove an existing task", () => {
    const task = taskService.create({ title: "Delete Me" });
    const result = taskService.remove(task.id);
    expect(result).toBe(true);
    expect(taskService.findById(task.id)).toBeUndefined();
  });

  it("should complete a task and set the timestamp", () => {
    const task = taskService.create({ title: "Finish Me" });
    const completed = taskService.completeTask(task.id);
    expect(completed.status).toBe("done");
    expect(completed.completedAt).not.toBeNull();
  });
});
