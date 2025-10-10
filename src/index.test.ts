import { describe, expect, test, vi, beforeEach } from "vitest";
import axios from "axios";

// 各テスト実行前にaxiosのモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

describe("axios", () => {
  test("レスポンスが返ること", async () => {
    // const result = await axios.get("http://localhost:3000");
    const result = await axios.get("http://paint-map.localhost/api");

    expect(result.status).toBe(200);
		expect(result.data).toBeDefined();
		expect(result.data.error).toBe("undefined function");
  });
});
